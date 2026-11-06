export function roomDateLabel(date: string): string {
  return new Date(date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function predictionStartLabel(createdAt: string, startedAt: string): string {
  const start = new Date(startedAt);
  const time = start.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  return start.toDateString() === new Date(createdAt).toDateString() ? time : `${roomDateLabel(startedAt)}, ${time}`;
}
