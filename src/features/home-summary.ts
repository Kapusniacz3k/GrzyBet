import { calculateResults, type Room } from './domain.ts';
import { calculateCouponResults } from './coupons.ts';

type RecentTrip = {
  room: Room;
  mushrooms: number;
  result: { kind: 'points'; points: number } | { kind: 'balance'; balanceCents: number };
};

/** Select only this account's trips; live rooms never supply a result preview. */
export function homeSummary(rooms: readonly Room[], userId: string): { active?: Room; recent?: RecentTrip } {
  const mine = rooms.filter(room => room.joined && room.members.includes(userId));
  const active = mine.filter(room => room.phase !== 'finished')
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
  const recent = mine.filter(room => room.phase === 'finished')
    .sort((a, b) => Date.parse(b.finishedAt ?? b.date) - Date.parse(a.finishedAt ?? a.date))[0];
  if (!recent) return { active };
  if (recent.gameMode === 'coupons') {
    const row = calculateCouponResults(recent).find(result => result.member === userId);
    return { active, recent: { room: recent, mushrooms: row?.mushrooms ?? 0,
      result: { kind: 'balance', balanceCents: row?.balanceCents ?? 0 } } };
  }
  const row = calculateResults(recent).find(result => result.member === userId);
  return { active, recent: { room: recent, mushrooms: row?.mushrooms ?? 0,
    result: { kind: 'points', points: row?.points ?? 0 } } };
}
