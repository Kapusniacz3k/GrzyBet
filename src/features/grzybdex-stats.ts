import type { Room } from './domain';

export const mushroomBadges = [
  { id: 'wood', name: 'Drewno', threshold: 1, color: '#BB956E' },
  { id: 'bronze', name: 'Brąz', threshold: 10, color: '#CE915E' },
  { id: 'silver', name: 'Srebro', threshold: 50, color: '#C5D2DF' },
  { id: 'gold', name: 'Złoto', threshold: 100, color: '#EFCA62' },
  { id: 'diamond', name: 'Diament', threshold: 250, color: '#7DDEE8' },
  { id: 'mushroomer', name: 'Grzybiarz', threshold: 1000, color: '#A4E6B6' },
] as const;
export type MushroomBadge = typeof mushroomBadges[number];
export type SpeciesStats = { species: string; total: number; bestTrip: number; trips: number };

/** Rebuild from approved quantities, so repeated snapshots never add duplicate progress. */
export function calculateGrzybdex(rooms: readonly Room[], userId: string, speciesNames: readonly string[]): SpeciesStats[] {
  const stats = new Map(speciesNames.map(name => [name, { species: name, total: 0, bestTrip: 0, trips: 0 }]));
  for (const room of rooms) {
    if (!room.joined || !room.members.includes(userId) || !['collecting', 'finished'].includes(room.phase)) continue;
    const tripTotals = new Map<string, number>();
    for (const harvest of room.harvests) {
      if (harvest.member !== userId || harvest.status !== 'approved' || !stats.has(harvest.species) ||
        !Number.isSafeInteger(harvest.count) || harvest.count <= 0) continue;
      tripTotals.set(harvest.species, (tripTotals.get(harvest.species) ?? 0) + harvest.count);
    }
    for (const [name, count] of tripTotals) {
      const entry = stats.get(name)!;
      entry.total += count;
      entry.bestTrip = Math.max(entry.bestTrip, count);
      entry.trips++;
    }
  }
  return [...stats.values()];
}

export function badgeProgress(total: number) {
  const earned = mushroomBadges.filter(badge => total >= badge.threshold);
  const current = earned.at(-1);
  const next = mushroomBadges.find(badge => total < badge.threshold);
  return {
    current, next, earned: earned.length,
    remaining: next ? next.threshold - total : 0,
    percent: next ? Math.min(100, Math.max(0, total / next.threshold * 100)) : 100,
  };
}
