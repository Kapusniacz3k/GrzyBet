import type { Room } from './domain';
import { species } from './mushroom-species.ts';

export const COUPON_BUDGET = 10;
export const couponMarkets = ['winner', 'own', 'total', 'species'] as const;
export type CouponMarket = typeof couponMarkets[number];
export type CouponPicks = Partial<Record<CouponMarket, string>>;
export type Coupon = { id: string; stake: number; picks: CouponPicks };
export type CouponWallet = { spent: number; slips: Coupon[] };
export const couponMarketLabels: Record<CouponMarket, string> = {
  winner: 'Kto zbierze najwięcej?', own: 'Twój zbiór', total: 'Zbiór całej ekipy', species: 'Najczęstszy gatunek',
};
/** Version 1 prices are fixed for the whole trip. Values are hundredths of decimal odds. */
export const couponLines = {
  own: [{ line: 5, over: 150, under: 230 }, { line: 10, over: 190, under: 180 }, { line: 20, over: 280, under: 130 }],
  total: [{ line: 20, over: 160, under: 210 }, { line: 50, over: 200, under: 170 }, { line: 100, over: 300, under: 125 }],
} as const;

export function couponPickOdds(room: Room, market: CouponMarket, value: string): number {
  if (market === 'winner' && room.members.includes(value)) return Math.max(150, room.members.length * 150);
  if (market === 'species' && species.includes(value)) return 500;
  if (market === 'own' || market === 'total') {
    for (const option of couponLines[market]) {
      if (value === `over${option.line}`) return option.over;
      if (value === `under${option.line}`) return option.under;
    }
  }
  throw new Error('Wybierz zakład z dostępnej oferty.');
}

export function validateCouponPicks(room: Room, picks: CouponPicks): void {
  if (!picks || typeof picks !== 'object' || Array.isArray(picks)) throw new Error('Niepoprawne zakłady.');
  const keys = Object.keys(picks);
  if (keys.length === 0 || keys.some(key => !couponMarkets.includes(key as CouponMarket))) throw new Error('Wybierz od jednego do czterech różnych zakładów.');
  for (const market of couponMarkets) {
    if (!Object.hasOwn(picks, market)) continue;
    if (typeof picks[market] !== 'string') throw new Error('Niepoprawny typ zakładu.');
    couponPickOdds(room, market, picks[market]);
  }
}

export function couponOdds(room: Room, picks: CouponPicks): number {
  validateCouponPicks(room, picks);
  let product = 1;
  let count = 0;
  for (const market of couponMarkets) if (picks[market] !== undefined) {
    product *= couponPickOdds(room, market, picks[market]);
    count++;
  }
  return Math.round(product / 100 ** (count - 1));
}

export function couponWallet(room: Room, actor: string): CouponWallet {
  return room.couponBook?.[actor] ?? { spent: 0, slips: [] };
}

function assertCouponOpen(room: Room, actor: string) {
  if (!room.members.includes(actor)) throw new Error('Nie należysz do tej wyprawy.');
  if (room.gameMode !== 'coupons' || room.couponVersion !== 1) throw new Error('Ta wyprawa nie korzysta z trybu kuponów.');
  if (room.phase !== 'predicting') throw new Error('Kupony są dostępne tylko po otwarciu zakładów i przed poszukiwaniami.');
  if (room.readyIds?.includes(actor)) throw new Error('Zakończyłeś już stawianie kuponów.');
}

export function placeCoupon(room: Room, coupon: Coupon, actor: string): Room {
  assertCouponOpen(room, actor);
  if (!coupon || Object.keys(coupon).some(key => !['id', 'stake', 'picks'].includes(key))) throw new Error('Kupon zawiera nieznane pola.');
  if (typeof coupon.id !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(coupon.id)) throw new Error('Niepoprawny identyfikator kuponu.');
  validateCouponPicks(room, coupon.picks);
  if (!Number.isInteger(coupon.stake) || coupon.stake < 1 || coupon.stake > COUPON_BUDGET) throw new Error('Stawka musi być pełną liczbą od 1 do 10 grzybków.');
  const wallet = couponWallet(room, actor);
  const duplicate = wallet.slips.find(item => item.id === coupon.id);
  if (duplicate) {
    if (duplicate.stake === coupon.stake && couponMarkets.every(key => duplicate.picks[key] === coupon.picks[key])) return room;
    throw new Error('Ten kupon został już zapisany.');
  }
  if (wallet.spent + coupon.stake > COUPON_BUDGET) throw new Error('Nie masz wystarczająco grzybków na ten kupon.');
  const saved: Coupon = { id: coupon.id, stake: coupon.stake, picks: { ...coupon.picks } };
  return { ...room, couponBook: { ...room.couponBook, [actor]: { spent: wallet.spent + saved.stake, slips: [...wallet.slips, saved] } } };
}

export function finishCoupons(room: Room, actor: string): Room {
  assertCouponOpen(room, actor);
  return { ...room, readyIds: [...(room.readyIds ?? []), actor] };
}

export type CouponPickResult = { market: CouponMarket; value: string; actual: string[] | number; won: boolean };
export type SettledCoupon = Coupon & { odds: number; payoutCents: number; won: boolean; results: CouponPickResult[] };
export type CouponResultRow = { member: string; mushrooms: number; spent: number; payoutCents: number; balanceCents: number; netCents: number; won: number; place: number; slips: SettledCoupon[] };

export function calculateCouponResults(room: Room): CouponResultRow[] {
  if (room.gameMode !== 'coupons' || room.phase !== 'finished') return [];
  const totals = new Map(room.members.map(id => [id, 0]));
  const kinds = new Map<string, number>();
  for (const harvest of room.harvests) if (harvest.status === 'approved' && totals.has(harvest.member)) {
    totals.set(harvest.member, totals.get(harvest.member)! + harvest.count);
    kinds.set(harvest.species, (kinds.get(harvest.species) ?? 0) + harvest.count);
  }
  const max = Math.max(0, ...totals.values());
  const maxSpecies = Math.max(0, ...kinds.values());
  const actuals = {
    winner: max > 0 ? [...totals].filter(([, count]) => count === max).map(([id]) => id) : [],
    species: maxSpecies > 0 ? [...kinds].filter(([, count]) => count === maxSpecies).map(([kind]) => kind) : [],
    total: [...totals.values()].reduce((sum, count) => sum + count, 0),
  };
  const rows = room.members.map(member => {
    const wallet = couponWallet(room, member);
    const mushrooms = totals.get(member)!;
    const slips = wallet.slips.map(coupon => {
      const results: CouponPickResult[] = couponMarkets.flatMap(market => {
        const value = coupon.picks[market];
        if (value === undefined) return [];
        const actual = market === 'own' ? mushrooms : actuals[market];
        const won = Array.isArray(actual) ? actual.includes(value)
          : value.startsWith('over') ? actual > Number(value.slice(4)) : actual <= Number(value.slice(5));
        return [{ market, value, actual, won }];
      });
      const won = results.length > 0 && results.every(result => result.won);
      const odds = couponOdds(room, coupon.picks);
      return { ...coupon, odds, won, payoutCents: won ? coupon.stake * odds : 0, results };
    });
    const payoutCents = slips.reduce((sum, coupon) => sum + coupon.payoutCents, 0);
    const balanceCents = (COUPON_BUDGET - wallet.spent) * 100 + payoutCents;
    return { member, mushrooms, spent: wallet.spent, payoutCents, balanceCents, netCents: balanceCents - COUPON_BUDGET * 100,
      won: slips.filter(coupon => coupon.won).length, slips, place: 0 };
  }).sort((a, b) => b.balanceCents - a.balanceCents);
  return rows.map(row => ({ ...row, place: rows.findIndex(other => other.balanceCents === row.balanceCents) + 1 }));
}

export function formatGrzybki(cents: number) {
  return (cents / 100).toLocaleString('pl-PL', { maximumFractionDigits: 2 });
}
export function formatOdds(hundredths: number) {
  return (hundredths / 100).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
