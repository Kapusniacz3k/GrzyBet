import { questionKeys, type Harvest, type QuestionKey, type Room, type Ticket } from './domain.ts';
import { species as speciesNames } from './mushroom-species.ts';
import { placeCoupon, type Coupon } from './coupons.ts';

const species = new Set(speciesNames);
const phases = new Set(['lobby', 'predicting', 'collecting', 'finished']);
const statuses = new Set(['pending', 'approved', 'rejected']);

function invalid(path: string): never {
  throw new Error(`Zapisane dane są uszkodzone (${path}). Oryginalny zapis nie został zmieniony.`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(path);
  return value as Record<string, unknown>;
}

function text(value: unknown, path: string, max = 300): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) invalid(path);
  return value;
}

function integer(value: unknown, path: string, min = 0, max = 999999): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) invalid(path);
  return value;
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') invalid(path);
  return value;
}

function date(value: unknown, path: string): string {
  const result = text(value, path, 64);
  const match = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/.exec(result);
  if (!match || !Number.isFinite(Date.parse(result))) invalid(path);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > days) invalid(path);
  return result;
}

function knownSpecies(value: unknown, path: string): string {
  const result = text(value, path);
  if (!species.has(result)) invalid(path);
  return result;
}

function ticket(value: unknown, members: string[], path: string, scoringVersion?: 2): Ticket {
  const data = record(value, path);
  const winner = text(data.winner, `${path}.winner`);
  if (!members.includes(winner)) invalid(`${path}.winner`);
  const own = integer(data.own, `${path}.own`);
  const total = integer(data.total, `${path}.total`);
  if (total < own) invalid(`${path}.total`);
  if (data.boost !== undefined && (scoringVersion !== 2 || !questionKeys.includes(data.boost as QuestionKey))) invalid(`${path}.boost`);
  return { winner, own, total, species: knownSpecies(data.species, `${path}.species`),
    ...(data.boost === undefined ? {} : { boost: data.boost as QuestionKey }) };
}

function draft(value: unknown, members: string[], path: string): Partial<Ticket> {
  const data = record(value, path);
  const keys = ['winner', 'own', 'total', 'species'] as const;
  if (Object.keys(data).some(key => !keys.includes(key as typeof keys[number]))) invalid(path);
  const result: Partial<Ticket> = {};
  let missing = false;
  for (const key of keys) {
    if (data[key] === undefined) { missing = true; continue; }
    if (missing) invalid(`${path}.kolejność pytań`);
    if (key === 'winner') {
      result.winner = text(data.winner, path);
      if (!members.includes(result.winner)) invalid(path);
    } else if (key === 'species') result.species = knownSpecies(data.species, path);
    else result[key] = integer(data[key], path);
  }
  if (result.total !== undefined && result.total < result.own!) invalid(path);
  return result;
}

function harvest(value: unknown, members: string[], path: string): Harvest {
  const data = record(value, path);
  const member = text(data.member, `${path}.member`);
  if (!members.includes(member)) invalid(`${path}.member`);
  const status = text(data.status, `${path}.status`);
  if (!statuses.has(status)) invalid(`${path}.status`);
  const photoUri = text(data.photoUri, `${path}.photoUri`, 3_000_000);
  if (!/^(?:file:\/\/|content:\/\/|data:image\/)/i.test(photoUri)) invalid(`${path}.photoUri`);
  if (typeof data.note !== 'string' || data.note.length > 300) invalid(`${path}.note`);
  const rejectionReason = data.rejectionReason === undefined ? undefined : text(data.rejectionReason, `${path}.rejectionReason`);
  if (status === 'rejected' && !rejectionReason) invalid(`${path}.rejectionReason`);
  return {
    id: text(data.id, `${path}.id`), member,
    species: knownSpecies(data.species, `${path}.species`),
    count: integer(data.count, `${path}.count`, 1), photoUri, note: data.note,
    createdAt: date(data.createdAt, `${path}.createdAt`),
    status: status as Harvest['status'],
    ...(rejectionReason === undefined ? {} : { rejectionReason }),
  };
}

function room(value: unknown, index: number, legacy: boolean): Room {
  const path = `pokój ${index + 1}`;
  const data = record(value, path);
  if (!Array.isArray(data.members) || data.members.length === 0) invalid(`${path}.members`);
  const members = data.members.map((value, i) => text(value, `${path}.members[${i}]`));
  if (new Set(members).size !== members.length) invalid(`${path}.members`);
  const host = text(data.host, `${path}.host`);
  if (!members.includes(host)) invalid(`${path}.host`);
  const limit = integer(data.limit, `${path}.limit`, 2, 30);
  if (members.length > limit) invalid(`${path}.limit`);
  const originalPhase = text(data.phase, `${path}.phase`);
  if (legacy && !['lobby', 'locked', 'collecting', 'finished'].includes(originalPhase)) invalid(`${path}.phase`);
  const phase = legacy && originalPhase === 'locked' ? 'predicting' : originalPhase;
  if (!phases.has(phase)) invalid(`${path}.phase`);
  const closed = boolean(data.closed, `${path}.closed`);
  if (closed !== (phase !== 'lobby')) invalid(`${path}.closed`);
  const joined = boolean(data.joined, `${path}.joined`);
  if (joined !== members.includes('Kuba')) invalid(`${path}.joined`);
  if (data.scoringVersion !== undefined && data.scoringVersion !== 2) invalid(`${path}.scoringVersion`);
  const scoringVersion = data.scoringVersion as 2 | undefined;
  let tickets = Object.fromEntries(Object.entries(record(data.tickets, `${path}.tickets`)).map(([member, value]) => {
    if (!members.includes(member)) invalid(`${path}.tickets.${member}`);
    return [member, ticket(value, members, `${path}.tickets.${member}`, scoringVersion)];
  }));
  let currentTicket = data.ticket === undefined ? undefined : ticket(data.ticket, members, `${path}.ticket`, scoringVersion);
  if (JSON.stringify(currentTicket) !== JSON.stringify(tickets.Kuba)) invalid(`${path}.ticket`);
  const answers: Record<string, Partial<Ticket>> = legacy ? {} : Object.fromEntries(
    Object.entries(record(data.answers, `${path}.answers`)).map(([member, value]) => {
      if (!members.includes(member) || tickets[member]) invalid(`${path}.answers.${member}`);
      return [member, draft(value, members, `${path}.answers.${member}`)];
    }),
  );
  // Old lobby tickets become drafts: the organizer still has to start questions.
  if (legacy && phase === 'lobby') {
    Object.assign(answers, tickets);
    tickets = {};
    currentTicket = undefined;
  }
  if (phase === 'lobby' && Object.keys(tickets).length) invalid(`${path}.tickets`);
  if (!Array.isArray(data.harvests)) invalid(`${path}.harvests`);
  const harvests = data.harvests.map((value, i) => harvest(value, members, `${path}.harvests[${i}]`));
  if (new Set(harvests.map(item => item.id)).size !== harvests.length) invalid(`${path}.harvests`);
  const finishedAt = data.finishedAt === undefined ? undefined : date(data.finishedAt, `${path}.finishedAt`);
  const predictionStartedAt = data.predictionStartedAt === undefined ? undefined : date(data.predictionStartedAt, `${path}.predictionStartedAt`);
  if (phase === 'lobby' && predictionStartedAt !== undefined) invalid(`${path}.predictionStartedAt`);
  if ((phase === 'finished') !== (finishedAt !== undefined)) invalid(`${path}.finishedAt`);
  if (phase === 'finished' && harvests.some(item => item.status === 'pending')) invalid(`${path}.harvests`);
  if ((phase === 'lobby' || phase === 'predicting') && harvests.length) invalid(`${path}.harvests`);
  const result: Room = {
    id: text(data.id, `${path}.id`), name: text(data.name, `${path}.name`, 60),
    code: text(data.code, `${path}.code`, 64), date: date(data.date, `${path}.date`),
    limit, members, host, joined, closed, phase: phase as Room['phase'], tickets, answers, harvests,
    ...(scoringVersion === undefined ? {} : { scoringVersion }),
    ...(currentTicket === undefined ? {} : { ticket: currentTicket }),
    ...(finishedAt === undefined ? {} : { finishedAt }),
    ...(predictionStartedAt === undefined ? {} : { predictionStartedAt }),
  };
  if (data.gameMode !== undefined && data.gameMode !== 'classic' && data.gameMode !== 'coupons') invalid(`${path}.gameMode`);
  if (data.gameMode !== undefined) result.gameMode = data.gameMode;
  if (data.gameMode === 'coupons') {
    if (data.couponVersion !== 1 || Object.keys(tickets).length || Object.values(answers).some(draft => Object.keys(draft).length)) invalid(`${path}.couponVersion`);
    if (!Array.isArray(data.readyIds) || data.readyIds.some(id => typeof id !== 'string' || !members.includes(id)) || new Set(data.readyIds).size !== data.readyIds.length) invalid(`${path}.readyIds`);
    result.couponVersion = 1;
    result.readyIds = data.readyIds as string[];
    result.couponBook = {};
    for (const [member, value] of Object.entries(record(data.couponBook, `${path}.couponBook`))) {
      if (!members.includes(member) || phase === 'lobby') invalid(`${path}.couponBook.${member}`);
      const wallet = record(value, `${path}.couponBook.${member}`);
      if (Object.keys(wallet).some(key => !['spent', 'slips'].includes(key)) || !Array.isArray(wallet.slips)) invalid(`${path}.couponBook.${member}`);
      let replay: Room = { ...result, phase: 'predicting', readyIds: [], couponBook: {} };
      for (const [index, slip] of wallet.slips.entries()) {
        try { replay = placeCoupon(replay, slip as Coupon, member); }
        catch { invalid(`${path}.couponBook.${member}.slips[${index}]`); }
        if (replay.couponBook![member].slips.length !== index + 1) invalid(`${path}.couponBook.${member}.slips`);
      }
      const restored = replay.couponBook?.[member] ?? { spent: 0, slips: [] };
      if (integer(wallet.spent, `${path}.spent`, 0, 10) !== restored.spent) invalid(`${path}.spent`);
      result.couponBook[member] = restored;
    }
    if (phase === 'lobby' && result.readyIds.length) invalid(`${path}.readyIds`);
    if (['collecting', 'finished'].includes(phase) && members.some(id => !result.readyIds!.includes(id))) invalid(`${path}.readyIds`);
  } else if (data.couponVersion !== undefined || data.couponBook !== undefined) invalid(`${path}.couponBook`);
  return result;
}

function validateState(value: unknown): Room[] {
  const data = record(value, 'format zapisu');
  if (data.version !== 1 && data.version !== 2) throw new Error('Nieobsługiwana wersja zapisu. Oryginalne dane nie zostały zmienione.');
  if (!Array.isArray(data.rooms)) invalid('lista pokojów');
  const rooms = data.rooms.map((value, index) => room(value, index, data.version === 1));
  if (new Set(rooms.map(item => item.id)).size !== rooms.length) invalid('powtórzone identyfikatory pokojów');
  if (new Set(rooms.map(item => item.code)).size !== rooms.length) invalid('powtórzone kody pokojów');
  return rooms;
}

export function encodeRooms(rooms: Room[]): string {
  return JSON.stringify({ version: 2, rooms: validateState({ version: 2, rooms }) });
}

export function decodeRooms(raw: string): Room[] {
  let data: unknown;
  try { data = JSON.parse(raw); } catch { invalid('niepoprawny JSON'); }
  return validateState(data);
}
