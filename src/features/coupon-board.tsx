import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '@/constants/app-theme';
import { CheckIcon, ChevronIcon, CloseIcon, HelpCircleIcon, MushroomIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable } from '@/components/motion';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { isReady, memberName, useGame, type Room } from './game';
import {
  calculateCouponResults, COUPON_BUDGET, couponLinesFor, couponMarketLabels, couponMarkets, couponMaxPicks, couponNumberPick, couponOdds, couponPickOdds,
  couponWallet, formatGrzybki, formatOdds, type Coupon, type CouponMarket, type CouponPicks, type SettledCoupon,
} from './coupons';
import { SpeciesPicker } from './species-picker';
import { speciesLabel } from './mushroom-species';
import { Button, Card, Copy, Field, Label, Message, Page } from './ui';
import { RoomHeader } from './room-header';

function pickLabel(room: Room, market: CouponMarket, value: string) {
  if (market === 'winner') return memberName(room, value);
  if (market === 'species') return speciesLabel(value);
  const option = couponNumberPick(room, market, value);
  return `${option.direction === 'over' ? 'Powyżej' : 'Poniżej'} ${option.line},5 szt.`;
}

export function CouponRoom({ room, children }: { room: Room; children: ReactNode }) {
  const { userId, placeCoupon, finishCoupons, busy } = useGame();
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const [picks, setPicks] = useState<CouponPicks>({});
  const [stake, setStake] = useState('1');
  const [message, setMessage] = useState('');
  const [confirmReady, setConfirmReady] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const wallet = couponWallet(room, userId);
  const available = COUPON_BUDGET - wallet.spent;
  const ready = isReady(room, userId);
  const count = Object.keys(picks).length;
  const odds = count ? couponOdds(room, picks) : 0;
  const validStake = /^\d+$/.test(stake) && Number(stake) >= 1 && Number(stake) <= available;
  const disabled = busy || ready || available === 0;
  function select(market: CouponMarket, value: string) {
    setMessage('');
    setPicks(current => {
      const next = { ...current };
      if (current[market] === value) delete next[market];
      else {
        if (room.couponVersion === 2 && (market === 'own' || market === 'total')) delete next[market === 'own' ? 'total' : 'own'];
        next[market] = value;
      }
      return next;
    });
  }
  async function place() {
    try { await placeCoupon(room.id, picks, Number(stake)); setPicks({}); setStake('1'); setMessage('Kupon postawiony. Możesz wybrać kolejne zakłady.'); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function readyUp() {
    try { await finishCoupons(room.id); setPicks({}); setConfirmReady(false); setMessage(''); }
    catch (e) { setMessage((e as Error).message); }
  }
  const footer = !ready && count > 0 && available > 0 ? <View style={styles.composer}>
    <View style={styles.between}><Text style={styles.composerTitle}>Twój kupon · {count} {count === 1 ? 'typ' : 'typy'}</Text><Text style={styles.odds}>Kurs {formatOdds(odds)}</Text></View>
    <View style={styles.composerRow}>
      <View style={styles.stake}><Field label={`Stawka (1–${available})`} value={stake} onChangeText={setStake} keyboardType="number-pad" maxLength={2} editable={!busy} style={styles.stakeField} /></View>
      <View style={styles.place}><Text style={styles.meta}>Do wygrania</Text><Text style={styles.payout}>{formatGrzybki(validStake ? Number(stake) * odds : 0)} <Text style={styles.meta}>grzybków</Text></Text></View>
    </View>
    <Button title="Postaw kupon" disabled={busy || !validStake} onPress={() => { void place(); }} />
  </View> : undefined;
  return <Page key={`${room.id}-${ready ? 'ready' : 'open'}`} topInset={false} contentStyle={{ paddingTop: 0 }} footer={footer}>
    <RoomHeader room={room} title="Zakłady wyprawy" />
    <Card><View style={styles.between}><View style={styles.flex}><Text style={styles.meta}>Dostępne grzybki</Text><Text style={styles.balance}>{available}<Text style={styles.balanceUnit}> / {COUPON_BUDGET}</Text></Text></View>
      <View style={styles.stateIcon}><MushroomIcon size={25} color={colors.textMuted} stemColor={colors.textSecondary} /></View></View>
      <View style={styles.walletFooter}><Text style={styles.meta}>Postawione grzybki: {wallet.spent}</Text><Text style={styles.meta}>Kupony: {wallet.slips.length}</Text></View>
    </Card>
    <Message text={message} />
    {ready ? <Card><View style={styles.between}><View style={styles.flex}><Text style={styles.meta}>Kupony zapisane</Text><Label>Jesteś gotowy</Label></View><View style={styles.stateIcon}><CheckIcon size={18} color={colors.textMuted} /></View></View>
      <Copy>Gdy wszyscy będą gotowi, gospodarz uruchomi poszukiwania.</Copy></Card> : <>
      <Pressable accessibilityRole="button" accessibilityLabel="Jak działają kupony?" aria-expanded={rulesExpanded}
        onPress={() => setRulesExpanded(current => !current)} style={({ pressed }) => [styles.rulesToggle, pressed && { opacity: 0.65 }]}>
        <HelpCircleIcon size={18} color={colors.textMuted} /><Text style={styles.rulesLabel}>Jak działają kupony?</Text>
        <ChevronIcon size={15} color={colors.textMuted} direction={rulesExpanded ? 'up' : 'down'} />
      </Pressable>
      {rulesExpanded && <Card><Copy>Na każdą wyprawę dostajesz nowe {COUPON_BUDGET} grzybków. To wyłącznie punkty w grze.</Copy>
        <Copy>Wybierz od 1 do {couponMaxPicks(room)} typów, po jednym z każdej kategorii. Kurs łączny to iloczyn kursów. Wszystkie typy muszą trafić, żeby kupon wygrał. Wygrana zawiera stawkę.</Copy>
        {room.couponVersion === 2 && <Copy>Własny zbiór i wynik ekipy stawiaj na osobnych kuponach — wybór jednego zastępuje drugi. Przy remisie wygrana jest dzielona przez liczbę współzwycięzców lub najczęstszych gatunków.</Copy>}
      </Card>}
      {count > 0 && <Card><View style={styles.between}><Label>Wybrane typy</Label><Text style={styles.pill}>{count} / {couponMaxPicks(room)}</Text></View>{couponMarkets.filter(key => picks[key]).map(key =>
        <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Usuń typ: ${couponMarketLabels[key]}`} disabled={busy}
          onPress={() => select(key, picks[key]!)} style={({ pressed }) => [styles.selectedPick, pressed && styles.dimmed]}>
          <View style={styles.flex}><Text style={styles.meta}>{couponMarketLabels[key]}</Text><Text style={styles.pickValue}>{pickLabel(room, key, picks[key]!)}</Text></View>
          <Text style={styles.odds}>{formatOdds(couponPickOdds(room, key, picks[key]!))}</Text><CloseIcon size={15} color={colors.textMuted} />
        </Pressable>)}</Card>}
      {available > 0 && <>
        <Label>Wszystkie zakłady</Label>
        <Card><Label>{couponMarketLabels.winner}</Label><View style={styles.quotes}>
          {(room.couponVersion === 1 || room.members.length >= 2) ? room.members.map(member => <Quote key={member} label={memberName(room, member)} odds={couponPickOdds(room, 'winner', member)}
            selected={picks.winner === member} disabled={disabled} onPress={() => select('winner', member)} />) : <Copy>Zakład na zwycięzcę jest dostępny od 2 uczestników.</Copy>}
        </View></Card>
        {(['own', 'total'] as const).map(market => <Card key={market}><Label>{couponMarketLabels[market]}</Label>
          {market === 'own' && room.couponVersion === 2 && <Copy>Typuj cel do przekroczenia. Punkty wymagają zatwierdzonych zbiorów.</Copy>}
          {market === 'total' && room.couponVersion === 2 && <Copy>{room.members.length >= 2 ? `Progi dla ${room.members.length} uczestników.` : 'Zakład na wynik ekipy jest dostępny od 2 uczestników.'}</Copy>}
          {couponLinesFor(room, market).map(option => <View key={option.id} style={styles.line}>
            <Copy>Łącznie {option.line},5 grzyba</Copy><View style={styles.quotes}>
              {option.under !== undefined && <Quote context={`${couponMarketLabels[market]}, ${option.line},5 sztuk`} label="Poniżej" odds={option.under} selected={picks[market] === `under${option.id}`} disabled={disabled} onPress={() => select(market, `under${option.id}`)} />}
              <Quote context={`${couponMarketLabels[market]}, ${option.line},5 sztuk`} label="Powyżej" odds={option.over} selected={picks[market] === `over${option.id}`} disabled={disabled} onPress={() => select(market, `over${option.id}`)} />
            </View>
          </View>)}
        </Card>)}
        <Card><Label>{couponMarketLabels.species}</Label><Copy>Kurs każdego gatunku: 5,00</Copy>
          <SpeciesPicker value={picks.species ?? ''} onChange={value => select('species', value)} disabled={disabled} />
        </Card>
      </>}
      {available === 0 && <Card><Label>Wszystkie grzybki postawione</Label><Copy>Twoje kupony czekają na rozstrzygnięcie. Zakończ stawianie, żeby gospodarz mógł uruchomić poszukiwania.</Copy></Card>}
    </>}
    <Label>Moje kupony · {wallet.slips.length}</Label>
    {wallet.slips.map((coupon, index) => <CouponSlip key={`${coupon.id}-${index}`} room={room} coupon={coupon} index={index} />)}
    {!wallet.slips.length && <View style={styles.empty}><Copy>Nie postawiłeś jeszcze żadnego kuponu.</Copy></View>}
    {!ready && (confirmReady ? <Card><Label>Kończysz stawianie?</Label>
      <Copy>Po potwierdzeniu nie postawisz kolejnych kuponów. Niewydane grzybki zachowasz w wyniku. Wybrane, ale niepostawione typy zostaną pominięte.</Copy>
      <Button title="Potwierdź gotowość" disabled={busy} onPress={() => { void readyUp(); }} />
      <Button title="Wróć do zakładów" secondary disabled={busy} onPress={() => setConfirmReady(false)} />
    </Card> : <Button title="Kończę stawianie — jestem gotowy" secondary disabled={busy} onPress={() => setConfirmReady(true)} />)}
    {children}
  </Page>;
}

function Quote({ label, odds, selected, disabled, onPress, context }: { label: string; odds: number; selected: boolean; disabled: boolean; onPress: () => void; context?: string }) {
  const styles = useThemedStyles(createStyles);
  return <Pressable accessibilityRole="radio" accessibilityLabel={`${context ? `${context}, ` : ''}${label}, kurs ${formatOdds(odds)}`} aria-checked={selected}
    accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.quote, selected && styles.selected, (pressed || disabled) && styles.dimmed]}>
    <Text style={[styles.quoteLabel, selected && styles.selectedText]}>{label}</Text><Text style={[styles.odds, selected && styles.selectedText]}>{formatOdds(odds)}</Text>
  </Pressable>;
}

function CouponSlip({ room, coupon, index, own = true }: { room: Room; coupon: Coupon | SettledCoupon; index: number; own?: boolean }) {
  const styles = useThemedStyles(createStyles);
  const settled = room.phase === 'finished' && 'results' in coupon ? coupon : undefined;
  const odds = couponOdds(room, coupon.picks);
  return <Card><View style={styles.between}><Label>Kupon #{index + 1}</Label><Text style={styles.pill}>{settled ? settled.won ? 'Wygrany' : 'Przegrany' : 'Przyjęty'}</Text></View>
    {couponMarkets.filter(key => coupon.picks[key]).map(key => {
      const result = settled?.results.find(item => item.market === key);
      const actual = result && (Array.isArray(result.actual) ? result.actual.length
        ? result.actual.map(value => key === 'winner' ? memberName(room, value) : speciesLabel(value)).join(', ') : key === 'winner' ? 'Brak zwycięzcy' : 'Brak najczęstszego gatunku' : `${result.actual} szt.`);
      return <View key={key} style={styles.slipPick}><View style={styles.between}><Text style={[styles.meta, styles.shrink]}>{key === 'own' && !own ? 'Zbiór gracza' : couponMarketLabels[key]}</Text><Text style={styles.oddsSmall}>{formatOdds(couponPickOdds(room, key, coupon.picks[key]!))}</Text></View>
        <Text style={styles.pickValue}>{pickLabel(room, key, coupon.picks[key]!)}</Text>
        {result && <Text style={styles.meta}>{result.won ? 'Trafiony' : 'Nietrafiony'} · Wynik: {actual}</Text>}
      </View>;
    })}
    <View style={styles.slipTotals}><View style={styles.stat}><Text style={styles.meta}>Stawka</Text><Text style={styles.statValue}>{coupon.stake}</Text></View>
      <View style={styles.stat}><Text style={styles.meta}>Kurs łączny</Text><Text style={styles.statValue}>{formatOdds(odds)}</Text></View>
      <View style={styles.stat}><Text style={styles.meta}>{settled ? 'Wygrana' : 'Do wygrania'}</Text><Text style={styles.statValue}>{formatGrzybki(settled ? settled.payoutCents : coupon.stake * odds)}</Text></View></View>
    {settled && settled.won && settled.tieDivisor > 1 && <Copy>Remis: stawka × kurs ÷ {settled.tieDivisor}. Wygrana zaokrąglona w dół do 0,01 grzybka.</Copy>}
    <Text style={styles.meta}>Wygrana w grzybkach, zawiera stawkę.</Text>
  </Card>;
}

export function CouponResults({ room }: { room: Room }) {
  const { userId } = useGame();
  const [expanded, setExpanded] = useState<string | null>(null);
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  if (room.phase !== 'finished') return null;
  const results = calculateCouponResults(room);
  const own = results.find(row => row.member === userId);
  return <>
    <Label>Wyniki kuponów</Label>
    {own && <Card><Text style={styles.meta}>Twój stan końcowy</Text><Text style={styles.balance}>{formatGrzybki(own.balanceCents)} <Text style={styles.balanceUnit}>grzybków</Text></Text>
      <View style={styles.slipTotals}><View style={styles.stat}><Text style={styles.meta}>Start</Text><Text style={styles.statValue}>10</Text></View>
        <View style={styles.stat}><Text style={styles.meta}>Postawiono</Text><Text style={styles.statValue}>{own.spent}</Text></View>
        <View style={styles.stat}><Text style={styles.meta}>Wygrane</Text><Text style={styles.statValue}>{formatGrzybki(own.payoutCents)}</Text></View></View>
      <Text style={styles.meta}>Bilans: {own.netCents > 0 ? '+' : ''}{formatGrzybki(own.netCents)} · Wygrane kupony: {own.won}/{own.slips.length}</Text>
    </Card>}
    <Copy>Wygrywa największy stan końcowy: niewydane grzybki + wygrane kuponów ze stawką. Liczymy tylko zatwierdzone zbiory. Następna wyprawa zaczyna się z nowymi 10 grzybkami.</Copy>
    <Label>Wyniki ekipy</Label>
    {results.map(row => <View key={row.member} style={styles.section}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Wynik gracza ${memberName(room, row.member)}`}
        aria-expanded={expanded === row.member} onPress={() => setExpanded(current => current === row.member ? null : row.member)} style={styles.result}>
        <View style={styles.flex}><Label>{row.place}. {memberName(room, row.member)}{row.member === userId ? ' (Ty)' : ''}</Label>
          <Copy>{formatGrzybki(row.balanceCents)} grzybków</Copy>
          <Text style={styles.meta}>{row.mushrooms} szt. · Wygrane kupony: {row.won}/{row.slips.length}</Text></View>
        <ChevronIcon size={20} direction={expanded === row.member ? 'up' : 'down'} color={colors.textMuted} />
      </Pressable>
      {expanded === row.member && <>
        {row.slips.map((coupon, index) => <CouponSlip key={`${coupon.id}-${index}`} room={room} coupon={coupon} index={index} own={row.member === userId} />)}
        {!row.slips.length && <Copy>Brak postawionych kuponów. Zachowane 10 grzybków.</Copy>}
      </>}
    </View>)}
  </>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  rulesToggle: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
  rulesLabel: { color: c.textMuted, fontSize: 13, fontWeight: '500' },
  section: { gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1, minWidth: 0, gap: 4 },
  shrink: { flexShrink: 1 },
  meta: { color: c.textMuted, fontSize: 11, lineHeight: 17 },
  balance: { color: c.text, fontSize: 27, lineHeight: 34, fontWeight: '600', letterSpacing: -0.6 },
  balanceUnit: { color: c.textMuted, fontSize: 13, lineHeight: 21, fontWeight: '400', letterSpacing: 0 },
  stateIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: c.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  walletFooter: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },
  pill: { color: c.textMuted, backgroundColor: c.surfaceRaised, fontSize: 10, lineHeight: 15, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  selectedPick: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 5 },
  pickValue: { color: c.text, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  quotes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quote: { flexGrow: 1, flexBasis: '40%', minWidth: 100, minHeight: 60, justifyContent: 'space-between', gap: 6,
    borderWidth: 1, borderColor: c.border, borderRadius: 12, backgroundColor: c.surfaceInset, padding: 12 },
  quoteLabel: { color: c.textSecondary, fontSize: 13, lineHeight: 18 },
  odds: { color: c.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  oddsSmall: { color: c.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  selected: { borderColor: c.actionGreen, backgroundColor: c.navigationSurface },
  selectedText: { color: c.navigationActive },
  dimmed: { opacity: 0.6 },
  line: { gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border },
  composer: { width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: c.surface, borderTopWidth: 1,
    borderTopColor: c.border, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 22, paddingVertical: 14, gap: 10 },
  composerTitle: { color: c.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  stake: { flex: 1, minWidth: 100 },
  stakeField: { minHeight: 44, paddingVertical: 10, fontSize: 14, backgroundColor: c.surfaceInset },
  place: { flex: 1, gap: 3 },
  payout: { color: c.text, fontSize: 18, lineHeight: 25, fontWeight: '600' },
  slipPick: { gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },
  slipTotals: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 13 },
  stat: { flex: 1, minWidth: 60, gap: 4 },
  statValue: { color: c.text, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  empty: { paddingVertical: 6 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, minHeight: 72,
    backgroundColor: c.surface, borderRadius: 18 },
});
