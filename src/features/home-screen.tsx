import type { AppColors } from '@/constants/app-theme';
import { Fonts } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MotionPressable as Pressable, MotionView } from '@/components/motion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowIcon, ChevronIcon, GrzybdexIcon, HashIcon, HistoryIcon, InfoIcon, PeopleIcon, PlusIcon, SettingsIcon, SproutIcon } from '@/components/grzybet-icons';
import { species, statusLabel, useGame } from './game';
import { calculateGrzybdex } from './grzybdex-stats';
import { homeSummary } from './home-summary';
import { formatGrzybki } from './coupons';
import { HowToPlayModal } from './how-to-play-modal';
import { roomDateLabel } from './room-timing';

export function HomeScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const { rooms, userId, displayName } = useGame();
  const greeting = displayName.trim() ? `Witaj, ${displayName.trim()}` : 'Witaj';
  const [showHelp, setShowHelp] = useState(false);
  const [activeExpanded, setActiveExpanded] = useState(false);
  const { active, activeTrips, recent } = useMemo(() => homeSummary(rooms, userId), [rooms, userId]);
  const discovered = useMemo(() => calculateGrzybdex(rooms, userId, species).filter(item => item.total > 0).length, [rooms, userId]);
  const openRoom = (id: string) => router.push({ pathname: '/room/[id]', params: { id } });
  const openCollection = () => router.dismissTo('/grzybdex');

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <MotionView style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Jak to działa?" accessibilityHint="Otwiera instrukcję gry z rozwijanymi rozdziałami"
        onPress={() => setShowHelp(true)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <InfoIcon size={19} color={colors.textMuted} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.logo}>Grzy<Text style={styles.logoAccent}>Bet</Text></Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Ustawienia" onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <SettingsIcon size={22} color={colors.textMuted} />
      </Pressable>
    </MotionView>

    <ScrollView style={styles.content} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <MotionView delay={30} style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>{greeting}</Text>
      </MotionView>

      <MotionView delay={70} style={[styles.tripSection, !active && styles.emptyTripSection]}>
        {active ? <View style={styles.current}>
          <View style={styles.statusRow}><View style={styles.statusDot} /><Text style={styles.tripStatus}>{statusLabel(active)}</Text></View>
          <Text style={styles.roomName}>{active.name}</Text>
          <View style={styles.members}><PeopleIcon size={16} color={colors.textMuted} /><Text style={styles.smallCopy}>Uczestnicy: {active.members.length}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={'Wznów grę: ' + active.name}
            onPress={() => openRoom(active.id)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Wróć do wyprawy</Text><ArrowIcon size={18} color={colors.onActionGreen} />
          </Pressable>
        </View> : <View style={[styles.current, styles.empty]}>
          <View style={styles.emptyHeading}>
            <View style={styles.emptyIcon}><SproutIcon size={22} color={colors.textMuted} /></View>
            <Text style={styles.tripStatus}>Brak aktywnej wyprawy</Text>
          </View>
          <Text style={styles.roomName}>Zaplanuj wyprawę</Text>
          <Text style={styles.copy}>Stwórz pokój dla ekipy lub dołącz kodem do znajomych.</Text>
        </View>}

        {activeTrips.length > 1 && <View style={styles.activeTrips}>
          <Pressable accessibilityRole="button" accessibilityLabel="Aktywne wyprawy" aria-expanded={activeExpanded}
            accessibilityHint={activeExpanded ? 'Zwiń listę wypraw' : 'Pokaż wszystkie aktywne wyprawy'}
            onPress={() => setActiveExpanded(current => !current)}
            style={({ pressed }) => [styles.activeHeader, pressed && styles.pressed]}>
            <PeopleIcon size={17} color={colors.textMuted} />
            <Text style={styles.activeTitle}>Aktywne wyprawy</Text><Text style={styles.smallCopy}>{activeTrips.length}</Text>
            <ChevronIcon size={16} direction={activeExpanded ? 'up' : 'down'} color={colors.textMuted} />
          </Pressable>
          {activeExpanded && <View>{activeTrips.map(room => <Pressable key={room.id} accessibilityRole="button"
            accessibilityLabel={`Otwórz wyprawę ${room.name}, ${statusLabel(room)}`} onPress={() => openRoom(room.id)}
            style={({ pressed }) => [styles.activeItem, pressed && styles.pressed]}>
            <View style={styles.activeCopy}><Text style={styles.historyName}>{room.name}</Text>
              <Text style={styles.historyMeta}>{statusLabel(room)} · Uczestnicy: {room.members.length}</Text></View>
            <ArrowIcon size={16} direction="right" color={colors.textMuted} />
          </Pressable>)}</View>}
        </View>}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Stwórz pokój" onPress={() => router.push('/create')}
            style={({ pressed }) => [styles.shortcut, !active && styles.shortcutPrimary, pressed && styles.pressed]}>
            <PlusIcon size={21} color={active ? colors.textMuted : colors.onActionGreen} />
            <Text style={[styles.shortcutText, !active && styles.primaryText]}>Stwórz pokój</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Dołącz kodem" onPress={() => router.push('/join')}
            style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
            <HashIcon size={21} color={colors.textMuted} /><Text style={styles.shortcutText}>Dołącz kodem</Text>
          </Pressable>
        </View>
      </MotionView>

      <MotionView delay={100} style={styles.history}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Ostatnia wyprawa</Text>
        {recent ? <Pressable accessibilityRole="button" accessibilityLabel={'Podsumowanie wyprawy ' + recent.room.name}
          onPress={() => openRoom(recent.room.id)} style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}>
          <View style={styles.historyIcon}><HistoryIcon size={19} color={colors.textMuted} /></View>
          <View style={styles.historyCopy}>
            <Text style={styles.historyName}>{recent.room.name}</Text>
            <Text style={styles.historyMeta}>{roomDateLabel(recent.room.date)} · {recent.mushrooms} szt.</Text>
            <Text style={styles.historyResult}>{recent.result.kind === 'balance'
              ? `Saldo: ${formatGrzybki(recent.result.balanceCents)} grzybków · Kupony`
              : `${recent.result.points} pkt za typowanie`}</Text>
          </View>
          <ArrowIcon direction="right" size={18} color={colors.textMuted} />
        </Pressable> : <View style={styles.historyRow}>
          <View style={styles.historyIcon}><HistoryIcon size={19} color={colors.textMuted} /></View>
          <View style={styles.historyCopy}>
            <Text style={styles.historyName}>Pierwsza wyprawa przed Tobą</Text>
            <Text style={styles.historyMeta}>Po jej zakończeniu zobaczysz tutaj zbiory i wynik.</Text>
          </View>
        </View>}
      </MotionView>

      <MotionView delay={130}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Grzybedex: ${discovered} z ${species.length} gatunków`}
          accessibilityHint="Otwiera kolekcję grzybów" onPress={openCollection}
          style={({ pressed }) => [styles.collection, pressed && styles.pressed]}>
          <View style={styles.collectionHeading}>
            <View style={styles.collectionName}><GrzybdexIcon size={18} color={colors.textMuted} /><Text style={styles.sectionTitle}>Grzybedex</Text></View>
            <View style={styles.collectionValue}><Text style={styles.discovered}>{discovered}<Text style={styles.smallCopy}>/{species.length} gatunków</Text></Text><ArrowIcon direction="right" size={16} color={colors.textMuted} /></View>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel="Odkryte gatunki" aria-valuemin={0} aria-valuemax={species.length}
            aria-valuenow={discovered} style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${species.length ? discovered / species.length * 100 : 0}%` }]} />
          </View>
        </Pressable>
      </MotionView>
    </ScrollView>
    <HowToPlayModal visible={showHelp} onClose={() => setShowHelp(false)} />
  </SafeAreaView>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  logo: { flex: 1, minWidth: 0, textAlign: 'center', color: c.text, fontSize: 27, fontWeight: '800', letterSpacing: -1 },
  logoAccent: { color: c.navigationActive },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
  content: { flex: 1 },
  page: { width: '100%', maxWidth: 430, alignSelf: 'center', flexGrow: 1, justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24, gap: 18 },
  heading: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, minWidth: 0, color: c.text, fontFamily: Fonts.serif, fontSize: 28, lineHeight: 36, letterSpacing: -0.3, fontWeight: '400' },
  tripSection: { gap: 14 },
  emptyTripSection: { flexGrow: 1, justifyContent: 'center', paddingVertical: 8 },
  current: { backgroundColor: c.surface, borderRadius: 18, padding: 20, gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.textMuted },
  tripStatus: { flex: 1, color: c.textMuted, fontSize: 11, lineHeight: 17, fontWeight: '500' },
  roomName: { color: c.text, fontSize: 23, lineHeight: 28, fontWeight: '600', letterSpacing: -0.6 },
  members: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallCopy: { color: c.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '400' },
  primary: { minHeight: 50, backgroundColor: c.actionGreen, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 8 },
  primaryText: { color: c.onActionGreen, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  empty: { minHeight: 190, justifyContent: 'center' },
  emptyHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emptyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: c.surfaceRaised,
    alignItems: 'center', justifyContent: 'center' },
  copy: { color: c.textMuted, fontSize: 13, lineHeight: 21 },
  activeTrips: { borderBottomWidth: 1, borderBottomColor: c.border },
  activeHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeTitle: { flex: 1, minWidth: 0, color: c.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '500' },
  activeItem: { minHeight: 58, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border,
    flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeCopy: { flex: 1, minWidth: 0, gap: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  shortcut: { flex: 1, minWidth: 0, minHeight: 88, borderColor: c.border, borderWidth: 1, borderRadius: 14,
    padding: 14, justifyContent: 'center', alignItems: 'flex-start', gap: 10 },
  shortcutPrimary: { backgroundColor: c.actionGreen, borderColor: c.actionGreen },
  shortcutText: { color: c.text, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  history: { gap: 0 },
  sectionTitle: { color: c.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: c.border },
  historyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: c.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1, minWidth: 0, gap: 4 },
  historyName: { color: c.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  historyMeta: { color: c.textMuted, fontSize: 11, lineHeight: 17 },
  historyResult: { color: c.text, fontSize: 12, lineHeight: 18 },
  collection: { gap: 14 },
  collectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  collectionName: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  collectionValue: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  discovered: { color: c.text, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  progressTrack: { height: 4, borderRadius: 3, backgroundColor: c.surfaceRaised, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: c.progress },
});
