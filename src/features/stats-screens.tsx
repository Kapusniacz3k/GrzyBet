import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { ArrowIcon, ChevronIcon, HistoryIcon, SettingsIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable, motionLayout } from '@/components/motion';
import { calculateResults, memberName, useGame, type Room } from './game';
import { predictionStartLabel, roomDateLabel } from './room-timing';
import { DeleteAccountAction } from './delete-account-modal';
import { Button, Page } from './ui';
import { useAccount } from './account-context';
import { speciesLabel } from './mushroom-species';

function seasonStats(rooms: Room[]) {
  const stats = new Map<string, { name: string; points: number; wins: number; mushrooms: number }>();
  for (const room of rooms.filter(r => r.joined && r.phase === 'finished')) {
    for (const result of calculateResults(room)) {
      const row = stats.get(result.member) ?? { name: result.member, points: 0, wins: 0, mushrooms: 0 };
      row.points += result.points;
      row.mushrooms += result.mushrooms;
      if (result.place === 1 && result.points > 0) row.wins++;
      stats.set(result.member, row);
    }
  }
  return [...stats.values()];
}
export function ProfileScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const { rooms, userId, displayName, mode } = useGame();
  const account = useAccount();
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const mine = rooms.filter(r => r.joined);
  const history = mine.filter(r => r.phase === 'finished').sort((a, b) => Date.parse(b.finishedAt!) - Date.parse(a.finishedAt!));
  const stats = seasonStats(rooms).find(r => r.name === userId);
  const best = Math.max(0, ...history.flatMap(r => calculateResults(r).filter(row => row.member === userId).map(row => row.mushrooms)));
  const activeTickets = mine.filter(room => room.ticket && room.phase !== 'finished');
  function open(id: string) { router.push({ pathname: '/room/[id]', params: { id } }); }
  return <Page contentStyle={styles.page}>
    <View style={styles.pageHeader}>
      <Text accessibilityRole="header" style={styles.pageTitle}>Mój profil</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Ustawienia" onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.settings, pressed && styles.pressed]}><SettingsIcon size={23} color={colors.textMuted} /></Pressable>
    </View>

    <View style={styles.identity}>
      <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.avatar}>
        <Text style={styles.initial}>{displayName.trim().slice(0, 1).toLocaleUpperCase('pl') || '?'}</Text>
      </View>
      <View style={styles.identityText}>
        <Text accessibilityRole="header" style={styles.nickname}>{displayName}</Text>
        <Text style={styles.modeLabel}>{mode === 'online' ? account?.isGuest ? 'Profil gościa · Gra online' : 'Konto GrzyBet · Gra online' : 'Lokalny profil grzybiarza'}</Text>
      </View>
    </View>

    <View style={styles.statistics}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Twój dorobek</Text>
      <View style={styles.summaryCard}>
      <View style={styles.highlights}>
        <View accessible accessibilityLabel={`Zatwierdzone grzyby z zakończonych wypraw: ${stats?.mushrooms ?? 0}`} style={styles.highlight}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.highlightValue}>{stats?.mushrooms ?? 0}</Text>
          <Text style={styles.highlightLabel}>Zebrane grzyby</Text>
        </View>
        <View style={styles.highlightDivider} />
        <View accessible accessibilityLabel={`Punkty za typowanie z zakończonych wypraw: ${stats?.points ?? 0}`} style={styles.highlight}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.highlightValue}>{stats?.points ?? 0}</Text>
          <Text style={styles.highlightLabel}>Punkty za typowanie</Text>
        </View>
      </View>
      <Text style={styles.statsHint}>Z zakończonych wypraw</Text>
      <View style={styles.metrics}>
        <ProfileMetric value={history.length} label="Wyprawy" description="Zakończone wyprawy" />
        <ProfileMetric divider value={stats?.wins ?? 0} label="Wygrane" description="Wygrane typowania" />
        <ProfileMetric divider value={best} label="Rekord" description="Grzyby na najlepszej wyprawie" />
        <ProfileMetric divider value={mine.filter(room => room.ticket).length} label="Kupony" description="Zapisane kupony" />
      </View>
      </View>
    </View>

    <Animated.View layout={motionLayout} style={styles.history}>
      <Pressable accessibilityRole="button" accessibilityLabel="Historia wypraw" aria-expanded={historyExpanded}
        accessibilityHint={historyExpanded ? 'Zwiń historię wypraw' : 'Rozwiń historię wypraw'}
        onPress={() => setHistoryExpanded(current => !current)}
        style={({ pressed }) => [styles.historyHeader, pressed && styles.pressed]}>
        <HistoryIcon size={21} color={colors.textMuted} />
        <Text style={[styles.sectionTitle, styles.historyTitle]}>Historia wypraw</Text>
        <Text style={styles.count}>{history.length}</Text>
        <ChevronIcon size={18} direction={historyExpanded ? 'up' : 'down'} color={colors.textMuted} />
      </Pressable>
      {historyExpanded && <Animated.View entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
        exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)} style={styles.historyContent}>
        {!history.length && <Text style={styles.copy}>Po zakończeniu pierwszej wyprawy pojawi się tutaj jej podsumowanie.</Text>}
        {history.map(room => {
          const result = calculateResults(room).find(r => r.member === userId);
          if (!result) return null;
          return <Pressable key={room.id} accessibilityRole="button" accessibilityLabel={`Podsumowanie wyprawy ${room.name}`}
            onPress={() => open(room.id)} style={({ pressed }) => [styles.historyItem, pressed && styles.pressed]}>
            <View style={styles.tripHeading}>
              <View style={styles.tripText}><Text style={styles.tripName}>{room.name}</Text><Text style={styles.smallCopy}>{roomDateLabel(room.date)}{room.predictionStartedAt ? ` · start ${predictionStartLabel(room.date, room.predictionStartedAt)}` : ''}</Text></View>
              <Text style={styles.place}>{result.place}. miejsce</Text>
            </View>
            <View style={styles.tripFooter}>
              <Text style={styles.tripResult}>{result.points} pkt · {result.mushrooms} grzybów</Text>
              <ArrowIcon size={19} direction="up-right" color={colors.textMuted} />
            </View>
          </Pressable>;
        })}
      </Animated.View>}
    </Animated.View>
    <View style={styles.tickets}>
      <View style={styles.sectionHeading}><Text accessibilityRole="header" style={styles.sectionTitle}>Aktywne kupony</Text><Text style={styles.smallCopy}>{activeTickets.length}</Text></View>
      {!!activeTickets.length && <View style={styles.ticketList}>{activeTickets.map(room => <Pressable key={room.id} accessibilityRole="button" accessibilityLabel={`Otwórz pokój ${room.name}`}
        onPress={() => open(room.id)} style={({ pressed }) => [styles.ticket, pressed && styles.pressed]}>
        <View style={styles.tripText}><Text style={styles.tripName}>{room.name}</Text><Text style={styles.smallCopy}>{room.ticket ? memberName(room, room.ticket.winner) : ''} · {room.ticket ? speciesLabel(room.ticket.species) : ''}</Text></View>
        <ArrowIcon size={19} direction="up-right" color={colors.textMuted} />
      </Pressable>)}</View>}
      {!activeTickets.length && <Text style={styles.copy}>Nie masz teraz aktywnych kuponów.</Text>}
    </View>
    {account && <View style={styles.accountCard}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{account.isGuest ? 'Zachowaj swój postęp' : 'Twoje konto'}</Text>
      <Text style={styles.copy}>{account.isGuest ? 'Dodaj e-mail i hasło, żeby wrócić do swoich wypraw i Grzybedexu na innym telefonie.' : account.email}</Text>
      <Button title={account.isGuest ? 'Zabezpiecz konto' : 'Zarządzaj kontem'} secondary disabled={account.busy} onPress={() => router.push('/account')} />
      {account.isGuest && <Pressable accessibilityRole="button" disabled={account.busy} onPress={() => router.push({ pathname: '/account', params: { mode: 'login' } })}
        style={({ pressed }) => [styles.accountLink, pressed && styles.pressed]}><Text style={styles.copy}>Mam już konto — zaloguj się</Text></Pressable>}
      <DeleteAccountAction account={account} />
    </View>}
    <View style={styles.accountNote}>
      <Text style={styles.smallCopy}>{mode === 'online' ? account?.isGuest ? 'Konto gościa jest zapamiętane na tym urządzeniu. Zabezpiecz je e-mailem i hasłem, aby odzyskać dostęp po zmianie telefonu.' : 'Na innym urządzeniu zaloguj się tym samym e-mailem i hasłem, aby wrócić do swojego postępu.' : 'Dane i zdjęcia są zapisane lokalnie. Odinstalowanie aplikacji lub wyczyszczenie jej danych może je usunąć. Synchronizacja między telefonami nie jest jeszcze dostępna.'}</Text>
    </View>
  </Page>;
}

function ProfileMetric({ value, label, description, divider = false }: { value: number; label: string; description: string; divider?: boolean }) {
  const styles = useThemedStyles(createStyles);
  return <View accessible accessibilityLabel={`${description}: ${value}`} style={[styles.metric, divider && styles.metricDivider]}>
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  page: { gap: 26, paddingTop: 12 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  pageTitle: { flex: 1, color: c.text, fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.8 },
  settings: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  initial: { color: c.accent, fontSize: 27, fontWeight: '600' },
  identityText: { flex: 1, minWidth: 0, gap: 6 },
  nickname: { color: c.text, fontSize: 26, lineHeight: 33, fontWeight: '700', letterSpacing: -0.6 },
  modeLabel: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
  statistics: { gap: 12 },
  sectionTitle: { color: c.text, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  summaryCard: { borderWidth: 1, borderColor: c.border, borderRadius: 18, backgroundColor: c.surface, padding: 18, gap: 18 },
  highlights: { flexDirection: 'row', gap: 18 },
  highlight: { flex: 1, minWidth: 0, gap: 5 },
  highlightDivider: { width: 1, backgroundColor: c.border, marginVertical: 5 },
  highlightValue: { color: c.text, fontSize: 38, lineHeight: 46, fontWeight: '700', letterSpacing: -1.2 },
  highlightLabel: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
  statsHint: { color: c.textMuted, fontSize: 11, lineHeight: 17 },
  metrics: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16 },
  metric: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5, paddingHorizontal: 4 },
  metricDivider: { borderLeftWidth: 1, borderLeftColor: c.border },
  metricValue: { maxWidth: '100%', color: c.text, fontSize: 19, lineHeight: 25, fontWeight: '600', letterSpacing: -0.3 },
  metricLabel: { color: c.textMuted, fontSize: 10, lineHeight: 16 },
  history: { borderWidth: 1, borderColor: c.border, borderRadius: 18, backgroundColor: c.surface, overflow: 'hidden' },
  historyHeader: { minHeight: 64, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyTitle: { flex: 1, minWidth: 0 },
  count: { color: c.textMuted, fontSize: 12 },
  historyContent: { paddingHorizontal: 16, paddingBottom: 2 },
  historyItem: { borderTopWidth: 1, borderTopColor: c.border, paddingVertical: 16, gap: 12 },
  tripHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tripText: { flex: 1, minWidth: 0, gap: 5 },
  tripName: { color: c.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  place: { flexShrink: 1, color: c.textMuted, fontSize: 11, lineHeight: 17 },
  tripFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tripResult: { flex: 1, color: c.textMuted, fontSize: 12, lineHeight: 18 },
  tickets: { gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  ticketList: { borderBottomWidth: 1, borderBottomColor: c.border },
  ticket: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: c.border },
  copy: { color: c.textMuted, fontSize: 13, lineHeight: 20 },
  smallCopy: { color: c.textMuted, fontSize: 11, lineHeight: 18 },
  accountNote: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16 },
  accountCard: { borderWidth: 1, borderColor: c.border, borderRadius: 18, backgroundColor: c.surface, padding: 16, gap: 10 },
  accountLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  pressed: { opacity: 0.6 },
});
