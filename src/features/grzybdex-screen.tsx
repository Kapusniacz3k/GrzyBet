import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { Image } from 'expo-image';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiamondIcon, LockIcon, MushroomIcon, SparkleIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable, MotionView } from '@/components/motion';
import { species, useGame } from './game';
import { mushroomCatalog, mushroomNoteSource } from './grzybdex-catalog';
import { badgeProgress, calculateGrzybdex, type MushroomBadge, type SpeciesStats } from './grzybdex-stats';
import { Button, Copy, Page, useUIStyles, Title } from './ui';

function useCollection() {
  const { rooms, userId } = useGame();
  return useMemo(() => calculateGrzybdex(rooms, userId, species), [rooms, userId]);
}

export function GrzybdexScreen() {
  const styles = useThemedStyles(createStyles);
  const s = useUIStyles();
  const colors = useAppTheme();
  const collection = useCollection();
  const discovered = collection.filter(entry => entry.total > 0).length;
  const total = collection.reduce((sum, entry) => sum + entry.total, 0);
  const badges = collection.reduce((sum, entry) => sum + badgeProgress(entry.total).earned, 0);
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.collectionScreen}>
    <MotionView distance={0} style={styles.collectionHeader}>
      <View style={styles.collectionIntro}><Text style={styles.eyebrow}>TWOJA LEŚNA KOLEKCJA</Text>
        <Text accessibilityRole="header" style={styles.collectionTitle}>Grzybedex</Text>
        <Text style={styles.collectionCopy}>Każdy grzyb to krok do kolejnej odznaki.</Text></View>
      <View style={styles.summary}>
        <SummaryStat value={`${discovered}/${mushroomCatalog.length}`} label="gatunki" />
        <SummaryStat value={total} label="sztuki" />
        <SummaryStat value={badges} label="odznaki" />
      </View>
    </MotionView>
    <ScrollView style={styles.collectionScroll} contentContainerStyle={[s.page, styles.collectionContent]}>
    <View style={styles.grid}>
      {mushroomCatalog.map((mushroom, index) => {
        const stats = collection.find(entry => entry.species === mushroom.name)!;
        const progress = badgeProgress(stats.total);
        const unlocked = stats.total > 0;
        return <Pressable key={mushroom.id} enterDelay={Math.min(index, 7) * 45} accessibilityRole="button" accessibilityLabel={`Zobacz ${mushroom.label}`}
          accessibilityHint={unlocked ? `${stats.total} znalezionych sztuk. Otwiera statystyki, rangę i notatkę.` : 'Gatunek nieodkryty. Pierwsza zatwierdzona sztuka odblokuje zdjęcie i notatkę.'}
          onPress={() => router.push({ pathname: '/grzybdex/[id]', params: { id: mushroom.id } })}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
          {unlocked ? <Image accessible={false} source={mushroom.photo} contentFit="cover"
            contentPosition={mushroom.id === 'podgrzybek' ? 'top' : 'center'} style={styles.tilePhoto} />
            : <View style={[styles.tilePhoto, styles.lockedPhoto]}><LockIcon color={colors.lock} /></View>}
          <View style={styles.tileBody}>
            <Text style={styles.tileTitle}>{mushroom.label}</Text>
            <View style={styles.tileCountRow}><Text style={styles.tileCount}>{stats.total}</Text><Text style={styles.smallCopy}>szt.</Text></View>
            {progress.current
              ? <View style={[styles.badgePill, { borderColor: colors.badges[progress.current.id] }]}>
                <DiamondIcon size={10} color={colors.badges[progress.current.id]} />
                <Text style={[styles.pillLabel, { color: colors.badges[progress.current.id] }]}>{progress.current.name}</Text>
              </View>
              : <Text style={styles.undiscovered}>Jeszcze nieodkryty</Text>}
            <Text style={styles.smallCopy}>{!unlocked ? 'Odblokuj pierwszą sztuką' : progress.next
              ? `Do ${progress.next.name}: ${progress.remaining} szt.` : 'Najwyższa ranga'}</Text>
          </View>
        </Pressable>;
      })}
    </View>
    <Copy>Postęp tworzą Twoje zatwierdzone zbiory. Oczekujące i odrzucone zgłoszenia się nie liczą.</Copy>
    </ScrollView>
  </SafeAreaView>;
}

export function MushroomDetailsScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const collection = useCollection();
  const reducedMotion = useReducedMotion();
  const mushroom = mushroomCatalog.find(item => item.id === id);
  if (!mushroom) return <Page><Title>Nie znaleziono grzyba</Title><Copy>Wybierz gatunek ze swojej kolekcji.</Copy>
    <Button title="Wróć do Grzybedexu" onPress={() => router.replace('/grzybdex')} /></Page>;
  const stats = collection.find(entry => entry.species === mushroom.name)!;
  const unlocked = stats.total > 0;
  return <Page>
    <Stack.Screen options={{ title: mushroom.label }} />
    <View style={styles.intro}><Text style={styles.eyebrow}>KARTA GRZYBA</Text><Title>{mushroom.label}</Title><Copy>{mushroom.scientificName}</Copy></View>
    <View style={styles.heroPhotoFrame}>
      {unlocked ? <Image source={mushroom.photo} transition={reducedMotion ? 0 : 220} contentFit="contain" accessibilityLabel={`Zdjęcie: ${mushroom.label}`} style={styles.heroPhoto} />
        : <View style={[styles.heroPhoto, styles.lockedPhoto, styles.lockedHero]}>
          <LockIcon size={64} color={colors.lock} />
          <Text style={styles.lockedTitle}>Jeszcze nieodkryty</Text>
          <Text style={styles.lockedCopy}>Pierwsza zatwierdzona sztuka odblokuje zdjęcie i notatkę.</Text>
        </View>}
    </View>
    {unlocked && <MotionView distance={0} style={styles.noteCard}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>O grzybie</Text>
      <Copy>{mushroom.note}</Copy>
      <Link href={mushroomNoteSource} style={styles.sourceLink}>Źródło notatki: Lasy Państwowe ↗</Link>
    </MotionView>}
    <View style={styles.statRow}>
      <View style={styles.statCard}><Text style={styles.statNumber}>{stats.total}</Text><Text style={styles.statLabel}>Łącznie znaleziono</Text><Text style={styles.smallCopy}>sztuk tego gatunku</Text></View>
      <View style={styles.statCard}><Text style={styles.statNumber}>{stats.bestTrip}</Text><Text style={styles.statLabel}>Rekord na wyprawie</Text><Text style={styles.smallCopy}>sztuk podczas jednej wyprawy</Text></View>
    </View>
    <Copy>Wyprawy z tym gatunkiem: {stats.trips}. Liczymy sztuki z Twoich zatwierdzonych zgłoszeń.</Copy>
    <BadgeProgress stats={stats} />
    {unlocked && <View style={styles.credit}><Text style={styles.smallCopy}>Zdjęcie: {mushroom.author}</Text>
      <Link href={mushroom.source} style={styles.sourceLink}>Źródło zdjęcia ↗</Link>
      <Link href={mushroom.licenseUrl} style={styles.sourceLink}>Licencja: {mushroom.license} ↗</Link></View>}
  </Page>;
}

function SummaryStat({ value, label }: { value: number | string; label: string }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.summaryItem}><Text style={styles.summaryNumber}>{value}</Text><Text style={styles.smallCopy}>{label}</Text></View>;
}

function BadgeMark({ badge }: { badge: MushroomBadge }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const color = colors.badges[badge.id];
  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={[styles.medal, { borderColor: color }]}>
    {badge.id === 'diamond' ? <DiamondIcon color={color} />
      : badge.id === 'mushroomer' ? <SparkleIcon color={color} />
        : <MushroomIcon size={26} color={color} stemColor={color} />}
  </View>;
}

function BadgeProgress({ stats }: { stats: SpeciesStats }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const progress = badgeProgress(stats.total);
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.set(withTiming(progress.percent, { duration: 450, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [progress.percent, fill]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${fill.get()}%` as `${number}%` }));
  return <View style={styles.progressCard}>
    <View style={styles.currentBadge}>
      {progress.current ? <BadgeMark badge={progress.current} /> : <View style={styles.emptyMedal}><LockIcon size={26} color={colors.lock} /></View>}
      <View style={styles.badgeText}><Text style={styles.smallCopy}>{progress.current ? 'TWOJA RANGA' : 'PIERWSZY KROK'}</Text>
        <Text style={[styles.currentName, progress.current && { color: colors.badges[progress.current.id] }]}>{progress.current?.name ?? 'Znajdź pierwszą sztukę'}</Text></View>
    </View>
    {progress.next ? <>
      <Text style={styles.progressCopy}>Do rangi {progress.next.name} brakuje {progress.remaining} szt.</Text>
      <View accessibilityRole="progressbar" accessibilityLabel={`Postęp do rangi ${progress.next.name}`}
        aria-valuemin={0} aria-valuemax={progress.next.threshold} aria-valuenow={stats.total} style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.badges[progress.next.id] }, progressStyle]} />
      </View>
      <Text style={styles.smallCopy}>{stats.total} / {progress.next.threshold} szt.</Text>
    </> : <Text style={styles.progressCopy}>Najwyższa ranga zdobyta. Tytuł Grzybiarza jest Twój!</Text>}
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  collectionScreen: { flex: 1, backgroundColor: c.background },
  collectionHeader: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 14, gap: 12, flexShrink: 0 },
  collectionScroll: { flex: 1 },
  collectionContent: { paddingTop: 0 },
  collectionIntro: { gap: 4 },
  collectionTitle: { color: c.text, fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.8 },
  collectionCopy: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  intro: { gap: 8 },
  eyebrow: { color: c.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  summary: { flexDirection: 'row', paddingVertical: 8, borderWidth: 1, borderColor: c.border, borderRadius: 14, backgroundColor: c.surface },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryNumber: { color: c.text, fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.5 },
  smallCopy: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '47%', flexGrow: 1, minWidth: 0, borderWidth: 1, borderColor: c.border, borderRadius: 16, overflow: 'hidden', backgroundColor: c.surface },
  tilePhoto: { width: '100%', aspectRatio: 1.8, backgroundColor: c.photoPlaceholder },
  lockedPhoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: c.photoPlaceholder },
  lockedHero: { gap: 14, padding: 24 },
  lockedTitle: { color: c.textMuted, fontSize: 18, fontWeight: '700' },
  lockedCopy: { color: c.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  tileBody: { padding: 10, gap: 6 },
  tileTitle: { color: c.text, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  tileCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  tileCount: { color: c.accent, fontSize: 24, lineHeight: 28, fontWeight: '800' },
  undiscovered: { color: c.textMuted, fontSize: 11, lineHeight: 17 },
  badgePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 7 },
  pillLabel: { fontSize: 11, lineHeight: 17, fontWeight: '700' },
  heroPhotoFrame: { borderRadius: 18, overflow: 'hidden', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  heroPhoto: { width: '100%', height: 260 },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, gap: 7 },
  statNumber: { color: c.text, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  statLabel: { color: c.text, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  sectionTitle: { color: c.text, fontSize: 21, fontWeight: '700' },
  noteCard: { padding: 18, gap: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16 },
  progressCard: { padding: 18, gap: 14, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accentBorder, borderRadius: 16 },
  currentBadge: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgeText: { flex: 1, gap: 5 },
  currentName: { color: c.text, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  progressCopy: { color: c.textSecondary, fontSize: 14, lineHeight: 22 },
  track: { height: 7, backgroundColor: c.accentBorder, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  medal: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: c.photoPlaceholder },
  emptyMedal: { width: 46, height: 46, borderWidth: 1, borderStyle: 'dashed', borderColor: c.lock, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  credit: { gap: 6 },
  sourceLink: { color: c.accent, fontSize: 12, lineHeight: 20, paddingVertical: 8, alignSelf: 'flex-start' },
  pressed: { opacity: 0.65 },
});
