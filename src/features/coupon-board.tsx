import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '@/constants/app-theme';
import { ChevronIcon, MushroomIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable } from '@/components/motion';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { isReady, memberName, useGame, type Room } from './game';
import {
  calculateCouponResults, COUPON_BUDGET, couponLines, couponMarketLabels, couponMarkets, couponOdds, couponPickOdds,
  couponWallet, formatGrzybki, formatOdds, type Coupon, type CouponMarket, type CouponPicks, type SettledCoupon,
} from './coupons';
import { SpeciesPicker } from './species-picker';
import { speciesLabel } from './mushroom-species';
import { Button, Card, Choices, Copy, Field, Label, Message, Page, Title, useUIStyles } from './ui';

function pickLabel(room: Room, market: CouponMarket, value: string) {
  if (market === 'winner') return memberName(room, value);
  if (market === 'species') return speciesLabel(value);
  return value.startsWith('over') ? `Powyżej ${value.slice(4)},5 szt.` : `Poniżej ${value.slice(5)},5 szt.`;
}

export function CouponRoom({ room, children }: { room: Room; children: ReactNode }) {
  const { userId, placeCoupon, finishCoupons, busy } = useGame();
  const styles = useThemedStyles(createStyles);
  const s = useUIStyles();
  const colors = useAppTheme();
  const [picks, setPicks] = useState<CouponPicks>({});
  const [stake, setStake] = useState('1');
  const [message, setMessage] = useState('');
  const [confirmReady, setConfirmReady] = useState(false);
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
      else next[market] = value;
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
    <View style={styles.between}><Text style={styles.composerTitle}>Kupon · {count} {count === 1 ? 'typ' : 'typy'}</Text><Text style={styles.odds}>Kurs {formatOdds(odds)}</Text></View>
    <View style={styles.composerRow}>
      <View style={styles.stake}><Field label={`Stawka (1–${available})`} value={stake} onChangeText={setStake} keyboardType="number-pad" maxLength={2} editable={!busy} /></View>
      <View style={styles.place}><Copy>Do wygrania: {formatGrzybki(validStake ? Number(stake) * odds : 0)} grzybków</Copy>
        <Button title="Postaw kupon" disabled={busy || !validStake} onPress={() => { void place(); }} /></View>
    </View>
  </View> : undefined;
  return <Page topInset={false} contentStyle={{ paddingTop: 0 }} footer={footer}>
    <Text style={s.badge}>{ready ? 'KUPONY GOTOWE · CZEKAMY NA START' : 'ZAKŁADY OTWARTE'}</Text>
    <Title>Zakłady wyprawy</Title>
    <Card><View style={styles.between}><View><Copy>Dostępne grzybki</Copy><Text style={styles.balance}>{available}</Text></View><MushroomIcon size={40} color={colors.accent} stemColor={colors.textMuted} /></View>
      <Copy>Start: 10 · Postawiono: {wallet.spent}. Nowe 10 grzybków na każdą wyprawę. To wyłącznie punkty w grze.</Copy>
    </Card>
    <Message text={message} />
    {ready ? <Card><Label>Stawianie zakończone</Label><Copy>Twoje kupony są zapisane. Gdy wszyscy będą gotowi, gospodarz wystartuje poszukiwania.</Copy></Card> : <>
      <Copy>Wybierz od 1 do 4 typów, po jednym z każdej kategorii. Kurs łączny to iloczyn kursów. Wszystkie typy muszą trafić, żeby kupon wygrał. Wygrana zawiera stawkę.</Copy>
      {count > 0 && <Card><Label>Wybrane typy</Label>{couponMarkets.filter(key => picks[key]).map(key =>
        <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Usuń typ: ${couponMarketLabels[key]}`} disabled={busy}
          onPress={() => select(key, picks[key]!)} style={styles.between}>
          <View style={styles.flex}><Copy>{couponMarketLabels[key]}</Copy><Label>{pickLabel(room, key, picks[key]!)}</Label></View>
          <Copy>{formatOdds(couponPickOdds(room, key, picks[key]!))} · ×</Copy>
        </Pressable>)}</Card>}
      {available > 0 && <>
        <Label>Wszystkie zakłady</Label>
        <Card><Label>{couponMarketLabels.winner}</Label><View style={styles.quotes}>
          {room.members.map(member => <Quote key={member} label={memberName(room, member)} odds={couponPickOdds(room, 'winner', member)}
            selected={picks.winner === member} disabled={disabled} onPress={() => select('winner', member)} />)}
        </View></Card>
        {(['own', 'total'] as const).map(market => <Card key={market}><Label>{couponMarketLabels[market]}</Label>
          {couponLines[market].map(option => <View key={option.line} style={styles.line}>
            <Copy>Łącznie {option.line},5 grzyba</Copy><View style={styles.quotes}>
              <Quote context={`${couponMarketLabels[market]}, ${option.line},5 sztuk`} label="Poniżej" odds={option.under} selected={picks[market] === `under${option.line}`} disabled={disabled} onPress={() => select(market, `under${option.line}`)} />
              <Quote context={`${couponMarketLabels[market]}, ${option.line},5 sztuk`} label="Powyżej" odds={option.over} selected={picks[market] === `over${option.line}`} disabled={disabled} onPress={() => select(market, `over${option.line}`)} />
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
    {!wallet.slips.length && <Copy>Nie postawiłeś jeszcze żadnego kuponu.</Copy>}
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
    <Text style={styles.quoteLabel}>{label}</Text><Text style={styles.odds}>{formatOdds(odds)}</Text>
  </Pressable>;
}

function CouponSlip({ room, coupon, index, own = true }: { room: Room; coupon: Coupon | SettledCoupon; index: number; own?: boolean }) {
  const settled = room.phase === 'finished' && 'results' in coupon ? coupon : undefined;
  const odds = couponOdds(room, coupon.picks);
  return <Card><Label>Kupon #{index + 1}{settled ? settled.won ? ' · Wygrany' : ' · Przegrany' : ' · Przyjęty'}</Label>
    {couponMarkets.filter(key => coupon.picks[key]).map(key => {
      const result = settled?.results.find(item => item.market === key);
      const actual = result && (Array.isArray(result.actual) ? result.actual.length
        ? result.actual.map(value => key === 'winner' ? memberName(room, value) : speciesLabel(value)).join(', ') : 'Brak rozstrzygnięcia' : `${result.actual} szt.`);
      return <View key={key}><Copy>{key === 'own' && !own ? 'Zbiór gracza' : couponMarketLabels[key]} · {formatOdds(couponPickOdds(room, key, coupon.picks[key]!))}</Copy>
        <Label>{pickLabel(room, key, coupon.picks[key]!)}</Label>
        {result && <Copy>{result.won ? 'Trafiony' : 'Nietrafiony'} · Wynik: {actual}</Copy>}
      </View>;
    })}
    <Copy>Stawka: {coupon.stake} · Kurs: {formatOdds(odds)}</Copy>
    <Copy>{settled ? `Wygrana: ${formatGrzybki(settled.payoutCents)}` : `Do wygrania: ${formatGrzybki(coupon.stake * odds)}`} grzybków (ze stawką)</Copy>
  </Card>;
}

export function CouponResults({ room }: { room: Room }) {
  const { userId } = useGame();
  const [metric, setMetric] = useState('Kupony');
  const [expanded, setExpanded] = useState<string | null>(userId);
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  if (room.phase !== 'finished') return null;
  const results = calculateCouponResults(room);
  const own = results.find(row => row.member === userId);
  const rows = metric === 'Zbiory' ? [...results].sort((a, b) => b.mushrooms - a.mushrooms) : results;
  return <>
    <Label>Wyniki końcowe · Kupony</Label>
    {own && <Card><Copy>Twój stan końcowy</Copy><Text style={styles.balance}>{formatGrzybki(own.balanceCents)} grzybków</Text>
      <Copy>Start: 10 · Stawki: {own.spent} · Wygrane: {formatGrzybki(own.payoutCents)}</Copy>
      <Copy>Bilans: {own.netCents > 0 ? '+' : ''}{formatGrzybki(own.netCents)} · Wygrane kupony: {own.won}/{own.slips.length}</Copy>
    </Card>}
    <Copy>Wygrywa największy stan końcowy: niewydane grzybki + wygrane kuponów ze stawką. Liczymy tylko zatwierdzone zbiory. Następna wyprawa zaczyna się z nowymi 10 grzybkami.</Copy>
    <Choices options={['Kupony', 'Zbiory']} value={metric} onChange={setMetric} />
    {rows.map(row => <View key={row.member} style={styles.section}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Wynik gracza ${memberName(room, row.member)}`}
        aria-expanded={metric === 'Kupony' && expanded === row.member} onPress={() => setExpanded(current => current === row.member ? null : row.member)} style={styles.result}>
        <View style={styles.flex}><Label>{metric === 'Kupony' ? row.place : rows.findIndex(item => item.mushrooms === row.mushrooms) + 1}. {memberName(room, row.member)}{row.member === userId ? ' (Ty)' : ''}</Label>
          <Copy>{metric === 'Kupony' ? `${formatGrzybki(row.balanceCents)} grzybków · ${row.won}/${row.slips.length} wygranych kuponów` : `${row.mushrooms} zebranych grzybów`}</Copy></View>
        {metric === 'Kupony' && <ChevronIcon size={20} direction={expanded === row.member ? 'up' : 'down'} color={colors.textMuted} />}
      </Pressable>
      {metric === 'Kupony' && expanded === row.member && <>
        {row.slips.map((coupon, index) => <CouponSlip key={`${coupon.id}-${index}`} room={room} coupon={coupon} index={index} own={row.member === userId} />)}
        {!row.slips.length && <Copy>Brak postawionych kuponów. Zachowane 10 grzybków.</Copy>}
      </>}
    </View>)}
  </>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  section: { gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1, minWidth: 0, gap: 4 },
  balance: { color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  quotes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quote: { flexGrow: 1, flexBasis: '40%', minWidth: 100, minHeight: 62, justifyContent: 'space-between', gap: 8,
    borderWidth: 1, borderColor: c.borderStrong, borderRadius: 8, backgroundColor: c.surfaceRaised, padding: 12 },
  quoteLabel: { color: c.textSecondary, fontSize: 13, lineHeight: 18 },
  odds: { color: c.accent, fontSize: 16, fontWeight: '700' },
  selected: { borderColor: c.primary, backgroundColor: c.accentSoft },
  dimmed: { opacity: 0.6 },
  line: { gap: 8 },
  composer: { backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border, padding: 12, gap: 8 },
  composerTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  stake: { width: 94 },
  place: { flex: 1, gap: 6 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, minHeight: 72,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10 },
});
