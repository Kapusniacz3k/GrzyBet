import { species } from '../features/mushroom-species.ts';

export type HarvestDraft = { species: string; count: string; note: string; photoUri: string };
export type HarvestDraftScope = { mode: 'local' | 'online'; userId: string; roomId: string };
export type DraftStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
};
export const emptyHarvestDraft = (): HarvestDraft => ({ species: '', count: '', note: '', photoUri: '' });
const MAX_PHOTO_TEXT = 1_500_000;
const message = 'Nie udało się odczytać szkicu zbioru. Spróbuj ponownie lub świadomie usuń szkic.';

export function harvestDraftKey(scope: HarvestDraftScope) {
  if (!['local', 'online'].includes(scope.mode) || [scope.userId, scope.roomId].some(value => typeof value !== 'string' || !value.trim() || value.length > 300)) {
    throw new Error('Nieprawidłowy właściciel szkicu.');
  }
  return ['grzybet:harvest-draft:v1', scope.mode, encodeURIComponent(scope.userId), encodeURIComponent(scope.roomId)].join(':');
}

export function validateHarvestDraft(input: unknown): HarvestDraft {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(message);
  const value = input as Record<string, unknown>;
  if (Object.keys(value).length !== 4 || typeof value.species !== 'string' || (value.species !== '' && !species.includes(value.species)) ||
      typeof value.count !== 'string' || !/^\d{0,6}$/.test(value.count) || typeof value.note !== 'string' || value.note.length > 300 ||
      typeof value.photoUri !== 'string' || value.photoUri.length > MAX_PHOTO_TEXT) throw new Error(message);
  const uri = value.photoUri;
  if (uri !== '' && !/^file:\/\/[^\r\n]+$/.test(uri) && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(uri)) throw new Error(message);
  return { species: value.species, count: value.count, note: value.note, photoUri: uri };
}

function decode(raw: string | null) {
  if (raw === null) return emptyHarvestDraft();
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || Object.keys(value).length !== 2) throw new Error(message);
    return validateHarvestDraft(value.draft);
  } catch { throw new Error(message); }
}

const equal = (a: HarvestDraft, b: HarvestDraft) => a.species === b.species && a.count === b.count && a.note === b.note && a.photoUri === b.photoUri;

/** One shared instance per storage backend keeps reads, writes and deletes ordered per account/room. */
export function createHarvestDraftStore(storage: DraftStorage) {
  const queues = new Map<string, Promise<unknown>>();
  function queued<T>(key: string, action: () => Promise<T>): Promise<T> {
    const next = (queues.get(key) ?? Promise.resolve()).catch(() => {}).then(action);
    const tail = next.then(() => {}, () => {});
    queues.set(key, tail);
    void tail.then(() => { if (queues.get(key) === tail) queues.delete(key); });
    return next;
  }
  return {
    load(scope: HarvestDraftScope) {
      const key = harvestDraftKey(scope);
      return queued(key, async () => decode(await storage.getItem(key)));
    },
    save(scope: HarvestDraftScope, input: HarvestDraft) {
      const key = harvestDraftKey(scope);
      const draft = validateHarvestDraft(input);
      const serialized = JSON.stringify({ version: 1, draft });
      return queued(key, async () => {
        const previous = decode(await storage.getItem(key));
        await storage.setItem(key, serialized);
        return previous.photoUri !== draft.photoUri ? previous.photoUri : '';
      });
    },
    clear(scope: HarvestDraftScope, expected?: HarvestDraft) {
      const key = harvestDraftKey(scope);
      const snapshot = expected === undefined ? undefined : validateHarvestDraft(expected);
      return queued(key, async () => {
        const raw = await storage.getItem(key);
        let previous = emptyHarvestDraft();
        try { previous = decode(raw); } catch { if (snapshot) throw new Error(message); }
        // A late submit must not delete a newer draft created after navigation back.
        if (snapshot && !equal(previous, snapshot)) return { cleared: false, retiredPhoto: '' };
        await storage.removeItem(key);
        return { cleared: true, retiredPhoto: previous.photoUri };
      });
    },
  };
}

type Store = ReturnType<typeof createHarvestDraftStore>;
export type HarvestDraftSnapshot = { draft: HarvestDraft; ready: boolean; saving: boolean; error: string };

/** Kept independent of React so pending persistence also completes after screen unmount. */
export function createHarvestDraftSession(store: Store, scope: HarvestDraftScope, retirePhoto: (uri: string) => void = () => {}) {
  let snapshot: HarvestDraftSnapshot = { draft: emptyHarvestDraft(), ready: false, saving: false, error: '' };
  const listeners = new Set<() => void>();
  let revision = 0;
  let pending = 0;
  let loading: Promise<void> | undefined;
  let clearing = false;
  function emit(patch: Partial<HarvestDraftSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) listener();
  }
  async function persist() {
    if (!snapshot.ready || clearing) throw new Error('Poczekaj na wczytanie szkicu.');
    const draft = { ...snapshot.draft };
    const version = ++revision;
    pending++;
    emit({ saving: true });
    try {
      const retired = await store.save(scope, draft);
      if (retired) retirePhoto(retired);
      if (version === revision) emit({ error: '' });
    } catch (error) {
      if (version === revision) emit({ error: 'Nie udało się zapisać szkicu. Nie zamykaj aplikacji i ponów zapis.' });
      throw error;
    } finally { pending--; emit({ saving: pending > 0 }); }
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    load() {
      if (snapshot.ready) return Promise.resolve();
      if (loading) return loading;
      emit({ error: '' });
      loading = store.load(scope).then(draft => { emit({ draft, ready: true, error: '' }); })
        .catch(() => { emit({ error: message }); })
        .finally(() => { loading = undefined; });
      return loading;
    },
    update(patch: Partial<HarvestDraft>) {
      if (!snapshot.ready || clearing) return Promise.reject(new Error('Poczekaj na wczytanie szkicu.'));
      try { emit({ draft: validateHarvestDraft({ ...snapshot.draft, ...patch }) }); }
      catch (error) { emit({ error: 'Sprawdź dane szkicu: liczba do 6 cyfr, notatka do 300 znaków.' }); return Promise.reject(error); }
      return persist();
    },
    flush: persist,
    async clear(options: { preservePhoto?: string; force?: boolean } = {}) {
      if (clearing) throw new Error('Trwa usuwanie szkicu.');
      clearing = true;
      const draft = { ...snapshot.draft };
      revision++;
      emit({ saving: true });
      try {
        const result = await store.clear(scope, options.force ? undefined : draft);
        if (!result.cleared) throw new Error('Szkic został zmieniony w innym widoku. Otwórz formularz ponownie.');
        emit({ draft: emptyHarvestDraft(), ready: true, error: '' });
        for (const uri of new Set([result.retiredPhoto, draft.photoUri])) {
          if (uri && uri !== options.preservePhoto) retirePhoto(uri);
        }
      } catch (error) {
        emit({ error: error instanceof Error && error.message.startsWith('Szkic został') ? error.message : 'Nie udało się usunąć szkicu. Ponów tę czynność.' });
        throw error;
      } finally { clearing = false; emit({ saving: pending > 0 }); }
    },
  };
}
