import { isTerminalRoom, type Room } from './domain.ts';

export const accountDeletionDelay = 5000;
export const activeTripDeletionMessage = 'Masz aktywną wyprawę. Opuść lobby albo zakończ lub anuluj własne wyprawy. W pozostałych poproś organizatora o zakończenie lub anulowanie.';

export function hasActiveTrips(rooms: readonly Pick<Room, 'members' | 'phase'>[], userId: string): boolean {
  return rooms.some(room => room.members.includes(userId) && !isTerminalRoom(room));
}

export function deletionSecondsRemaining(openedAt: number, now: number): number {
  if (!Number.isFinite(openedAt) || !Number.isFinite(now)) return accountDeletionDelay / 1000;
  return Math.max(0, Math.ceil((accountDeletionDelay - (now - openedAt)) / 1000));
}

export function canDeleteAccount(openedAt: number, now: number, confirmed: boolean, busy: boolean): boolean {
  return confirmed && !busy && deletionSecondsRemaining(openedAt, now) === 0;
}
