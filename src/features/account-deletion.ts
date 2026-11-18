import type { Room } from './domain';

export const accountDeletionDelay = 5000;
export const activeTripDeletionMessage = 'Masz aktywną wyprawę. Najpierw zakończ wszystkie swoje wyprawy lub poproś ich organizatorów o zakończenie. Potem możesz usunąć konto.';

export function hasActiveTrips(rooms: readonly Pick<Room, 'members' | 'phase'>[], userId: string): boolean {
  return rooms.some(room => room.members.includes(userId) && room.phase !== 'finished');
}

export function deletionSecondsRemaining(openedAt: number, now: number): number {
  if (!Number.isFinite(openedAt) || !Number.isFinite(now)) return accountDeletionDelay / 1000;
  return Math.max(0, Math.ceil((accountDeletionDelay - (now - openedAt)) / 1000));
}

export function canDeleteAccount(openedAt: number, now: number, confirmed: boolean, busy: boolean): boolean {
  return confirmed && !busy && deletionSecondsRemaining(openedAt, now) === 0;
}
