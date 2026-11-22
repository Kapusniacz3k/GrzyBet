import { calculateResults, isTerminalRoom, type Room } from './domain.ts';
import { calculateCouponResults } from './coupons.ts';

type RecentTrip = {
  room: Room;
  mushrooms: number;
  result: { kind: 'points'; points: number } | { kind: 'balance'; balanceCents: number };
};

/** Keep canceled trips in history while completed-trip statistics use only finished trips. */
export function ownTripSections(rooms: readonly Room[], userId: string) {
  const mine = rooms.filter(room => room.joined && room.members.includes(userId));
  const activeTrips = mine.filter(room => !isTerminalRoom(room))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const history = mine.filter(isTerminalRoom)
    .sort((a, b) => Date.parse(b.finishedAt ?? b.date) - Date.parse(a.finishedAt ?? a.date));
  const finishedTrips = history.filter(room => room.phase === 'finished');
  return { mine, activeTrips, history, finishedTrips };
}

/** Select only this account's trips; live rooms never supply a result preview. */
export function homeSummary(rooms: readonly Room[], userId: string): { active?: Room; activeTrips: Room[]; recent?: RecentTrip } {
  const { activeTrips, finishedTrips } = ownTripSections(rooms, userId);
  const active = activeTrips[0];
  const recent = finishedTrips[0];
  if (!recent) return { active, activeTrips };
  if (recent.gameMode === 'coupons') {
    const row = calculateCouponResults(recent).find(result => result.member === userId);
    return { active, activeTrips, recent: { room: recent, mushrooms: row?.mushrooms ?? 0,
      result: { kind: 'balance', balanceCents: row?.balanceCents ?? 0 } } };
  }
  const row = calculateResults(recent).find(result => result.member === userId);
  return { active, activeTrips, recent: { room: recent, mushrooms: row?.mushrooms ?? 0,
    result: { kind: 'points', points: row?.points ?? 0 } } };
}
