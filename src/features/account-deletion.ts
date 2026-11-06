export const accountDeletionDelay = 5000;

export function deletionSecondsRemaining(openedAt: number, now: number): number {
  if (!Number.isFinite(openedAt) || !Number.isFinite(now)) return accountDeletionDelay / 1000;
  return Math.max(0, Math.ceil((accountDeletionDelay - (now - openedAt)) / 1000));
}

export function canDeleteAccount(openedAt: number, now: number, confirmed: boolean, busy: boolean): boolean {
  return confirmed && !busy && deletionSecondsRemaining(openedAt, now) === 0;
}
