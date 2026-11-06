import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { MushroomIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable, motionLayout } from '@/components/motion';
import { calculateResults, memberName, dateLabel, useGame, type Room } from './game';
import { Page } from './ui';
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
        style={({ pressed }) => [styles.settings, pressed && styles.pressed]}><Text style={styles.gear}>⚙</Text></Pressable>
    </View>

    <View style={styles.identity}>
      <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.avatar}>
        <Text style={styles.initial}>{displayName.trim().slice(0, 1).toLocaleUpperCase('pl') || '?'}</Text>
        <View style={styles.avatarMark}><MushroomIcon size={19} color={colors.primary} stemColor={colors.text} /></View>
      </View>
      <View style={styles.identityText}>
        <Text style={styles.eyebrow}>DOBRZE CIĘ WIDZIEĆ</Text>
        <Text accessibilityRole="header" style={styles.nickname}>{displayName}</Text>
        <View style={styles.modeRow}>
          <View style={styles.modeDot} />
          <Text style={styles.modeLabel}>{mode === 'online' ? 'Profil gościa · Gra online' : 'Lokalny profil grzybiarza'}</Text>
        </View>
      </View>
    </View>

    <View style={styles.statistics}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Twój dorobek</Text>
      <View style={styles.highlights}>
        <View accessible accessibilityLabel={`Zatwierdzone grzyby z zakończonych wypraw: ${stats?.mushrooms ?? 0}`} style={[styles.highlight, styles.harvestHighlight]}>
          <View style={styles.highlightTop}><MushroomIcon size={25} color={colors.accent} stemColor={colors.accent} /><Text style={styles.metricUnit}>SZT.</Text></View>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[styles.highlightValue, styles.harvestValue]}>{stats?.mushrooms ?? 0}</Text>
          <Text style={styles.highlightLabel}>Zebrane grzyby</Text>
        </View>
        <View accessible accessibilityLabel={`Punkty za typowanie z zakończonych wypraw: ${stats?.points ?? 0}`} style={styles.highlight}>
          <View style={styles.highlightTop}><Text accessible={false} style={styles.pointsIcon}>✦</Text><Text style={styles.metricUnit}>PKT</Text></View>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.highlightValue}>{stats?.points ?? 0}</Text>
          <Text style={styles.highlightLabel}>Za typowanie</Text>
        </View>
      </View>
      <Text style={styles.statsHint}>Zbiory i punkty z zakończonych wypraw</Text>
      <View style={styles.metrics}>
        <ProfileMetric value={history.length} label="Wyprawy" description="Zakończone wyprawy" />
        <ProfileMetric value={stats?.wins ?? 0} label="Wygrane" description="Wygrane typowania" />
        <ProfileMetric value={best} label="Rekord" description="Grzyby na najlepszej wyprawie" />
        <ProfileMetric value={mine.filter(room => room.ticket).length} label="Kupony" description="Zapisane kupony" />
      </View>
    </View>

    <Animated.View layout={motionLayout} style={styles.history}>
      <Pressable accessibilityRole="button" accessibilityLabel="Historia wypraw" aria-expanded={historyExpanded}
        accessibilityHint={historyExpanded ? 'Zwiń historię wypraw' : 'Rozwiń historię wypraw'}
        onPress={() => setHistoryExpanded(current => !current)}
        style={({ pressed }) => [styles.historyHeader, pressed && styles.pressed]}>
        <View style={styles.historyIcon}><Text accessible={false} style={styles.historySymbol}>↺</Text></View>
        <Text style={[styles.sectionTitle, styles.historyTitle]}>Historia wypraw</Text>
        <View style={styles.countPill}><Text style={styles.count}>{history.length}</Text></View>
        <Text style={styles.expandIcon}>{historyExpanded ? '−' : '+'}</Text>
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
              <View style={styles.tripText}><Text style={styles.tripName}>{room.name}</Text><Text style={styles.smallCopy}>{dateLabel(room.finishedAt!)}</Text></View>
              <Text style={styles.place}>{result.place}. miejsce</Text>
            </View>
            <View style={styles.tripFooter}>
              <Text style={styles.tripResult}>{result.points} pkt · {result.mushrooms} grzybów</Text>
              <Text style={styles.openArrow}>↗</Text>
            </View>
          </Pressable>;
        })}
      </Animated.View>}
    </Animated.View>
    <View style={styles.tickets}>
      <View style={styles.sectionHeading}><Text accessibilityRole="header" style={styles.sectionTitle}>Aktywne kupony</Text><Text style={styles.smallCopy}>{activeTickets.length}</Text></View>
      {activeTickets.map(room => <Pressable key={room.id} accessibilityRole="button" accessibilityLabel={`Otwórz pokój ${room.name}`}
        onPress={() => open(room.id)} style={({ pressed }) => [styles.ticket, pressed && styles.pressed]}>
        <View style={styles.tripText}><Text style={styles.tripName}>{room.name}</Text><Text style={styles.smallCopy}>{room.ticket ? memberName(room, room.ticket.winner) : ''} · {room.ticket ? speciesLabel(room.ticket.species) : ''}</Text></View>
        <Text style={styles.openArrow}>↗</Text>
      </Pressable>)}
      {!activeTickets.length && <View style={styles.emptyTickets}>
        <Text style={styles.emptyTitle}>Brak aktywnych kuponów</Text>
        <Text style={styles.copy}>Tutaj znajdziesz swoje typy na trwające wyprawy.</Text>
      </View>}
    </View>
    <View style={styles.accountNote}>
      <Text style={styles.accountTitle}>Twój profil, Twoje wyprawy</Text>
      <Text style={styles.smallCopy}>{mode === 'online' ? 'Konto gościa jest zapamiętane na tym urządzeniu. Nie czyść danych aplikacji, jeśli chcesz zachować dostęp do swoich wypraw.' : 'Dane i zdjęcia są zapisane lokalnie. Odinstalowanie aplikacji lub wyczyszczenie jej danych może je usunąć. Synchronizacja między telefonami nie jest jeszcze dostępna.'}</Text>
    </View>
  </Page>;
}

function ProfileMetric({ value, label, description }: { value: number; label: string; description: string }) {
  const styles = useThemedStyles(createStyles);
  return <View accessible accessibilityLabel={`${description}: ${value}`} style={styles.metric}>
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  page: { gap: 24, paddingTop: 12 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  pageTitle: { flex: 1, color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  settings: { width: 48, height: 48, borderWidth: 1, borderColor: c.border, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  gear: { color: c.text, fontSize: 26 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 20, borderWidth: 1, borderColor: c.accentBorder, backgroundColor: c.accentSoft, borderRadius: 24 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: c.avatar, borderWidth: 1, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center' },
  initial: { color: c.avatarText, fontSize: 30, fontWeight: '800' },
  avatarMark: { position: 'absolute', bottom: -3, right: -3, width: 27, height: 27, borderRadius: 14, borderWidth: 2, borderColor: c.accentSoft, backgroundColor: c.accentSurface, alignItems: 'center', justifyContent: 'center' },
  identityText: { flex: 1, minWidth: 0, gap: 8 },
  eyebrow: { color: c.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  nickname: { color: c.text, fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -0.6 },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.accent },
  modeLabel: { flex: 1, color: c.textSecondary, fontSize: 11, lineHeight: 17 },
  statistics: { gap: 14 },
  sectionTitle: { color: c.text, fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3 },
  highlights: { flexDirection: 'row', gap: 12 },
  highlight: { flex: 1, minWidth: 0, padding: 18, borderWidth: 1, borderColor: c.border, borderRadius: 20, backgroundColor: c.surface, gap: 9 },
  harvestHighlight: { backgroundColor: c.accentSoft, borderColor: c.accentBorder },
  highlightTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 26 },
  metricUnit: { color: c.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  pointsIcon: { color: c.gold, fontSize: 25, lineHeight: 27 },
  highlightValue: { color: c.text, fontSize: 38, lineHeight: 44, fontWeight: '800', letterSpacing: -1.5 },
  harvestValue: { color: c.accent },
  highlightLabel: { color: c.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  statsHint: { color: c.textMuted, fontSize: 11, lineHeight: 17 },
  metrics: { flexDirection: 'row', borderWidth: 1, borderColor: c.border, borderRadius: 16, backgroundColor: c.surfaceInset, paddingHorizontal: 6, paddingVertical: 16 },
  metric: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5, paddingHorizontal: 4 },
  metricValue: { maxWidth: '100%', color: c.text, fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.5 },
  metricLabel: { color: c.textMuted, fontSize: 10, lineHeight: 16 },
  history: { borderWidth: 1, borderColor: c.border, borderRadius: 18, backgroundColor: c.surface, overflow: 'hidden' },
  historyHeader: { minHeight: 76, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accentSurface },
  historySymbol: { color: c.accent, fontSize: 26, lineHeight: 30 },
  historyTitle: { flex: 1, minWidth: 0, fontSize: 16 },
  countPill: { minWidth: 26, minHeight: 26, paddingHorizontal: 7, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.border },
  count: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
  expandIcon: { color: c.textMuted, fontSize: 23, lineHeight: 28 },
  historyContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  historyItem: { borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceInset, borderRadius: 14, padding: 16, gap: 16 },
  tripHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tripText: { flex: 1, minWidth: 0, gap: 5 },
  tripName: { color: c.text, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  place: { flexShrink: 1, color: c.accent, fontSize: 11, lineHeight: 17, fontWeight: '600', paddingVertical: 4, paddingHorizontal: 7, backgroundColor: c.accentSurface, borderRadius: 7 },
  tripFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tripResult: { flex: 1, color: c.textSecondary, fontSize: 12, lineHeight: 18 },
  openArrow: { color: c.accent, fontSize: 23, lineHeight: 27 },
  tickets: { gap: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  ticket: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderWidth: 1, borderColor: c.border, borderRadius: 16, backgroundColor: c.surface },
  emptyTickets: { padding: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, borderRadius: 16, gap: 7 },
  emptyTitle: { color: c.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  copy: { color: c.textMuted, fontSize: 13, lineHeight: 20 },
  smallCopy: { color: c.textMuted, fontSize: 11, lineHeight: 18 },
  accountNote: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 20, gap: 8 },
  accountTitle: { color: c.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
