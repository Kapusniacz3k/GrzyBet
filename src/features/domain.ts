import { species } from './mushroom-species.ts';
export { species };

export type Phase = 'lobby' | 'predicting' | 'collecting' | 'finished';
export type Ticket = { winner: string; own: number; total: number; species: string };
export const questionKeys = ['winner', 'own', 'total', 'species'] as const;
export type QuestionKey = typeof questionKeys[number];
export type Harvest = {
  id: string;
  member: string;
  species: string;
  count: number;
  photoUri: string;
  note: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
};
export type Room = {
  id: string;
  name: string;
  code: string;
  /** Room creation time; the trip's displayed date comes from this timestamp. */
  date: string;
  limit: number;
  members: string[];
  host: string;
  joined: boolean;
  closed: boolean;
  /** Compatibility alias for the local player's ticket. */
  ticket?: Ticket;
  phase: Phase;
  tickets: Record<string, Ticket>;
  answers: Record<string, Partial<Ticket>>;
  harvests: Harvest[];
  /** Absent for lobbies and older saved trips whose start time was not recorded. */
  predictionStartedAt?: string;
  finishedAt?: string;
  /** Online snapshots use stable user IDs; labels and public readiness are separate. */
  names?: Record<string, string>;
  progress?: Record<string, number>;
  readyIds?: string[];
};
export type ResultBreakdown = { winner: number; own: number; total: number; species: number };
export type ResultRow = {
  member: string;
  mushrooms: number;
  points: number;
  place: number;
  breakdown: ResultBreakdown;
};

const MAX_COUNT = 999999;

function assertMember(room: Room, actor: string) {
  if (!room.members.includes(actor)) throw new Error('Nie należysz do tej wyprawy.');
}

function assertHost(room: Room, actor: string) {
  assertMember(room, actor);
  if (room.host !== actor) throw new Error('Ta czynność jest dostępna tylko dla organizatora.');
}

function validCount(value: number, minimum = 0) {
  return Number.isSafeInteger(value) && value >= minimum && value <= MAX_COUNT;
}

export function isClosed(room: Room) {
  return room.phase !== 'predicting';
}

export function statusLabel(room: Room) {
  if (room.phase === 'finished') return 'Zakończono';
  if (room.phase === 'collecting') return 'Poszukiwania w toku';
  if (room.phase === 'lobby') return 'Lobby · czekamy na start';
  return everyoneReady(room) ? 'Gotowi do poszukiwań' : 'Odpowiadamy na pytania';
}

export function answeredCount(room: Room, actor: string) {
  if (isReady(room, actor)) return questionKeys.length;
  if (!Object.hasOwn(room.answers, actor) && room.progress?.[actor] !== undefined) return room.progress[actor];
  const draft = room.answers[actor] ?? {};
  return questionKeys.filter(key => draft[key] !== undefined).length;
}

export function everyoneReady(room: Room) {
  return room.members.length > 0 && room.members.every(member => isReady(room, member));
}

export function isReady(room: Room, actor: string) {
  return room.readyIds ? room.readyIds.includes(actor) : !!room.tickets[actor];
}

export function memberName(room: Room, actor: string) {
  const name = room.names?.[actor] ?? actor;
  return room.names && room.members.some(other => other !== actor && room.names?.[other] === name)
    ? name + ' · ' + actor.slice(-4) : name;
}

function assertAnswering(room: Room, actor: string) {
  assertMember(room, actor);
  if (isClosed(room)) throw new Error('Pytania są dostępne dopiero po starcie typowania przez organizatora.');
  if (room.tickets[actor]) throw new Error('Twoje odpowiedzi są już zatwierdzone.');
}

export function answerQuestion(room: Room, key: QuestionKey, value: string | number, actor: string): Room {
  assertAnswering(room, actor);
  const draft = room.answers[actor] ?? {};
  if (questionKeys[answeredCount(room, actor)] !== key) throw new Error('Odpowiedz na pytania w podanej kolejności.');
  if (key === 'winner' && (typeof value !== 'string' || !room.members.includes(value))) throw new Error('Wybierz uczestnika wyprawy.');
  if (key === 'species' && (typeof value !== 'string' || !species.includes(value))) throw new Error('Wybierz gatunek grzybów.');
  if ((key === 'own' || key === 'total') && (typeof value !== 'number' || !validCount(value))) throw new Error('Wpisz pełną liczbę od 0 do 999999.');
  if (key === 'total' && Number(value) < draft.own!) throw new Error('Wynik ekipy nie może być mniejszy od Twojego.');
  return { ...room, answers: { ...room.answers, [actor]: { ...draft, [key]: value } } };
}

export function restartAnswers(room: Room, actor: string): Room {
  assertAnswering(room, actor);
  const answers = { ...room.answers };
  delete answers[actor];
  return { ...room, answers };
}

export function joinRoom(room: Room, actor: string): Room {
  if (room.members.includes(actor)) return actor === 'Kuba' ? { ...room, joined: true } : room;
  if (!actor.trim() || actor.length > 300) throw new Error('Podaj poprawną nazwę uczestnika.');
  if (room.phase !== 'lobby') throw new Error('Dołączanie jest zamknięte — organizator uruchomił już pytania.');
  if (room.members.length >= room.limit) throw new Error('W tym pokoju nie ma już wolnych miejsc.');
  return { ...room, members: [...room.members, actor], joined: actor === 'Kuba' || room.joined };
}

export function saveTicket(room: Room, ticket: Ticket, actor: string): Room {
  assertAnswering(room, actor);
  const draft = room.answers[actor] ?? {};
  if (answeredCount(room, actor) !== questionKeys.length || questionKeys.some(key => draft[key] !== ticket[key])) {
    throw new Error('Najpierw odpowiedz na wszystkie cztery pytania.');
  }
  if (!room.members.includes(ticket.winner)) throw new Error('Wybierz zwycięzcę spośród uczestników.');
  if (!species.includes(ticket.species)) throw new Error('Wybierz gatunek grzybów.');
  if (!validCount(ticket.own) || !validCount(ticket.total)) {
    throw new Error('Wpisz pełne liczby od 0 do 999999.');
  }
  if (ticket.total < ticket.own) throw new Error('Wynik ekipy nie może być mniejszy od Twojego.');
  const saved = { ...ticket };
  const answers = { ...room.answers };
  delete answers[actor];
  return {
    ...room,
    answers,
    tickets: { ...room.tickets, [actor]: saved },
    ...(actor === 'Kuba' ? { ticket: saved } : {}),
  };
}

export function transitionRoom(
  room: Room,
  action: 'begin' | 'start' | 'finish',
  actor: string,
  now = Date.now(),
): Room {
  assertHost(room, actor);
  if (room.phase === 'finished') throw new Error('Ta wyprawa jest już zakończona.');
  if (action === 'begin' && room.phase === 'lobby') return { ...room, phase: 'predicting', closed: true, predictionStartedAt: new Date(now).toISOString() };
  if (action === 'start' && room.phase === 'predicting') {
    if (!everyoneReady(room)) throw new Error('Poczekaj, aż wszyscy uczestnicy zakończą pytania.');
    return { ...room, phase: 'collecting', closed: true };
  }
  if (action === 'finish' && room.phase === 'collecting') {
    if (room.harvests.some(harvest => harvest.status === 'pending')) {
      throw new Error('Najpierw rozpatrz wszystkie oczekujące zgłoszenia.');
    }
    return { ...room, phase: 'finished', closed: true, finishedAt: new Date(now).toISOString() };
  }
  throw new Error('Ta czynność nie jest dostępna na obecnym etapie wyprawy.');
}

export function submitHarvest(room: Room, harvest: Harvest, actor: string): Room {
  assertMember(room, actor);
  if (room.phase !== 'collecting') throw new Error('Zbiory można zgłaszać tylko podczas wyprawy.');
  if (harvest.member !== actor) throw new Error('Możesz zgłaszać tylko własne zbiory.');
  if (!harvest.id.trim() || harvest.id.length > 300 || room.harvests.some(item => item.id === harvest.id)) {
    throw new Error('To zgłoszenie zostało już dodane lub ma niepoprawny identyfikator.');
  }
  if (!species.includes(harvest.species)) throw new Error('Wybierz gatunek grzybów.');
  if (!validCount(harvest.count, 1)) throw new Error('Liczba grzybów musi wynosić od 1 do 999999.');
  if (!/^(?:file:\/\/|content:\/\/|data:image\/)/i.test(harvest.photoUri) || harvest.photoUri.length > 3_000_000) {
    throw new Error('Dołącz zdjęcie zbioru zapisane na urządzeniu.');
  }
  if (harvest.note.length > 300) throw new Error('Notatka może mieć maksymalnie 300 znaków.');
  if (!Number.isFinite(Date.parse(harvest.createdAt))) throw new Error('Niepoprawna data zgłoszenia.');
  const pending: Harvest = {
    ...harvest,
    note: harvest.note.trim(),
    status: 'pending',
    rejectionReason: undefined,
  };
  return { ...room, harvests: [...room.harvests, pending] };
}

export function reviewHarvest(
  room: Room,
  id: string,
  decision: 'approved' | 'rejected',
  reason: string,
  actor: string,
): Room {
  assertHost(room, actor);
  if (room.phase !== 'collecting') throw new Error('Zgłoszenia można weryfikować tylko podczas wyprawy.');
  const harvest = room.harvests.find(item => item.id === id);
  if (!harvest) throw new Error('Nie znaleziono zgłoszenia.');
  if (harvest.status !== 'pending') throw new Error('To zgłoszenie zostało już rozpatrzone.');
  if (decision !== 'approved' && decision !== 'rejected') throw new Error('Niepoprawna decyzja.');
  if (decision === 'rejected' && !reason.trim()) throw new Error('Podaj powód odrzucenia zgłoszenia.');
  if (reason.length > 300) throw new Error('Powód może mieć maksymalnie 300 znaków.');
  return {
    ...room,
    harvests: room.harvests.map(item => item.id === id ? {
      ...item,
      status: decision,
      rejectionReason: decision === 'rejected' ? reason.trim() || undefined : undefined,
    } : item),
  };
}

/** Only approved harvests count. Ties share a place, without an arbitrary tie-break. */
export function calculateResults(room: Room): ResultRow[] {
  const totals = new Map(room.members.map(member => [member, 0]));
  const bySpecies = new Map(species.map(kind => [kind, 0]));
  for (const harvest of room.harvests) {
    if (harvest.status !== 'approved' || !totals.has(harvest.member)) continue;
    totals.set(harvest.member, (totals.get(harvest.member) ?? 0) + harvest.count);
    bySpecies.set(harvest.species, (bySpecies.get(harvest.species) ?? 0) + harvest.count);
  }
  const teamTotal = [...totals.values()].reduce((sum, count) => sum + count, 0);
  const mostMushrooms = Math.max(0, ...totals.values());
  const mostSpecies = Math.max(0, ...bySpecies.values());
  const rows = room.members.map(member => {
    const mushrooms = totals.get(member) ?? 0;
    const ticket = room.tickets[member] ?? (member === 'Kuba' ? room.ticket : undefined);
    const breakdown: ResultBreakdown = { winner: 0, own: 0, total: 0, species: 0 };
    if (ticket) {
      const difference = Math.abs(ticket.own - mushrooms);
      breakdown.winner = mostMushrooms > 0 && totals.get(ticket.winner) === mostMushrooms ? 100 : 0;
      breakdown.own = difference === 0 ? 100 : difference <= 3 ? 70 : difference <= 5 ? 40 : 0;
      breakdown.total = ticket.total === teamTotal ? 100 : 0;
      breakdown.species = mostSpecies > 0 && bySpecies.get(ticket.species) === mostSpecies ? 50 : 0;
    }
    return { member, mushrooms, breakdown, points: Object.values(breakdown).reduce((sum, value) => sum + value, 0), place: 0 };
  }).sort((a, b) => b.points - a.points);
  return rows.map(row => ({
    ...row,
    place: rows.findIndex(other => other.points === row.points) + 1,
  }));
}
