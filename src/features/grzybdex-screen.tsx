import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { Image } from 'expo-image';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, Platform, Pressable as NativePressable, StyleSheet, Text, TextInput, View, type ListRenderItemInfo } from 'react-native';
import Svg, { Defs, FeColorMatrix, Filter, Image as SvgImage } from 'react-native-svg';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckIcon, CloseIcon, DiamondIcon, ExclamationIcon, FilterIcon, InfoIcon, LockIcon, MushroomIcon, SearchIcon, SparkleIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable, MotionView } from '@/components/motion';
import { species, useGame } from './game';
import { mushroomCatalog } from './grzybdex-catalog';
import { badgeProgress, calculateGrzybdex, type MushroomBadge, type SpeciesStats } from './grzybdex-stats';
import { Button, Copy, Page, useUIStyles, Title } from './ui';
import { searchSpecies } from './mushroom-species';
import { MushroomTraitPicker } from './mushroom-trait-picker';
import { emptyTraitSelection, hasTraitFilters, identificationNotice, matchesMushroomTraits, mushroomTraits, selectedTraitCount, traitSelectionLabels } from './mushroom-traits';
import { edibilityLabels, edibilityNotice, mushroomEdibility } from './mushroom-edibility';

const nextBadgeLabel: Record<MushroomBadge['id'], string> = {
  wood: 'drewna', bronze: 'brązu', silver: 'srebra', gold: 'złota', diamond: 'diamentu', mushroomer: 'Grzybiarza',
};

type MushroomGridEntry = { mushroom: typeof mushroomCatalog[number]; total: number };
type MushroomGridRow = readonly MushroomGridEntry[];
const gridLayout = StyleSheet.create({ separator: { height: 12 } });
const mushroomRowKey = (row: MushroomGridRow) => row[0].mushroom.id;
const renderMushroomRow = ({ item }: ListRenderItemInfo<MushroomGridRow>) => <MushroomRow entries={item} />;
const MushroomRowSeparator = () => <View style={gridLayout.separator} />;

function useCollection() {
  const { rooms, userId } = useGame();
  return useMemo(() => calculateGrzybdex(rooms, userId, species), [rooms, userId]);
}

export function GrzybdexScreen() {
  const styles = useThemedStyles(createStyles);
  const s = useUIStyles();
  const colors = useAppTheme();
  const collection = useCollection();
  const [filter, setFilter] = useState<'all' | 'found' | 'locked'>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [traitFilters, setTraitFilters] = useState(emptyTraitSelection);
  const [traitPickerOpen, setTraitPickerOpen] = useState(false);
  const traitsActive = hasTraitFilters(traitFilters);
  const scroll = useRef<FlatList<MushroomGridRow>>(null);
  const matchingIds = useMemo(() => new Set(searchSpecies(query).map(item => item.id)), [query]);
  const entries = useMemo(() => {
    const totals = new Map(collection.map(entry => [entry.species, entry.total]));
    return mushroomCatalog.map(mushroom => ({ mushroom, total: totals.get(mushroom.name) ?? 0 }));
  }, [collection]);
  const visible = useMemo(() => entries.filter(({ mushroom, total }) => matchingIds.has(mushroom.id)
    && matchesMushroomTraits(mushroom.id, traitFilters)
    && (filter === 'all' || (filter === 'found' ? total > 0 : total === 0))), [entries, matchingIds, traitFilters, filter]);
  useEffect(() => { scroll.current?.scrollToOffset({ offset: 0, animated: false }); }, [query, filter, traitFilters]);
  // Fixed pairs keep two columns on native and web without measured-width rounding.
  const rows = useMemo(() => Array.from({ length: Math.ceil(visible.length / 2) }, (_, index) => visible.slice(index * 2, index * 2 + 2)), [visible]);
  const { discovered, total, badges } = useMemo(() => collection.reduce((summary, entry) => ({
    discovered: summary.discovered + Number(entry.total > 0), total: summary.total + entry.total,
    badges: summary.badges + badgeProgress(entry.total).earned,
  }), { discovered: 0, total: 0, badges: 0 }), [collection]);
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.collectionScreen}>
    <MotionView distance={0} style={styles.collectionHeader}>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={styles.collectionTitle}>Grzybedex</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Rozpoznaj po cechach" aria-expanded={traitPickerOpen}
          accessibilityHint="Wybierz kolejno kolor, spód, kształt i miejsce występowania."
          onPress={() => { Keyboard.dismiss(); setTraitPickerOpen(true); }}
          style={({ pressed }) => [styles.traitButton, traitsActive && styles.traitButtonActive, pressed && styles.pressed]}>
          <FilterIcon size={18} color={traitsActive ? colors.navigationActive : colors.textMuted} />
          <Text style={styles.traitButtonText}>Cechy{traitsActive ? ` · ${selectedTraitCount(traitFilters)}` : ''}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={searchOpen ? 'Zamknij wyszukiwanie' : 'Szukaj grzybów'}
          aria-expanded={searchOpen} onPress={() => {
            setSearchOpen(open => !open);
            setQuery('');
            Keyboard.dismiss();
          }} style={({ pressed }) => [styles.searchButton, searchOpen && styles.filterSelected, pressed && styles.pressed]}>
          {searchOpen ? <CloseIcon size={20} color={colors.textMuted} /> : <SearchIcon color={colors.textMuted} />}
        </Pressable>
      </View>
      {searchOpen && <MotionView distance={0} style={styles.search}>
        <View style={styles.searchRow}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput autoFocus accessibilityLabel="Szukaj grzyba w Grzybedexie" placeholder="Nazwa, np. prawdziwek…"
            value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none" returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()} placeholderTextColor={colors.textMuted} style={styles.searchInput} />
          {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Wyczyść wyszukiwanie"
            onPress={() => setQuery('')} style={styles.searchButton}><CloseIcon size={16} color={colors.textMuted} /></Pressable>}
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.smallCopy}>Wyniki: {visible.length}</Text>
      </MotionView>}
      <View style={styles.summary}>
        <SummaryStat value={`${discovered}/${mushroomCatalog.length}`} label="gatunki" />
        <SummaryStat value={total} label="sztuki" />
        <SummaryStat value={badges} label="odznaki" />
      </View>
      <View style={styles.filters}>
        {([{ id: 'all', label: 'Wszystkie' }, { id: 'found', label: 'Odkryte' }, { id: 'locked', label: 'Nieodkryte' }] as const).map(item =>
          <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: filter === item.id }}
            aria-pressed={filter === item.id} onPress={() => setFilter(item.id)}
            style={({ pressed }) => [styles.filter, filter === item.id && styles.filterSelected, pressed && styles.pressed]}>
            <Text style={[styles.filterLabel, filter === item.id && styles.filterLabelSelected]}>{item.label}</Text>
          </Pressable>)}
      </View>
    </MotionView>
    <FlatList ref={scroll} data={rows} renderItem={renderMushroomRow} keyExtractor={mushroomRowKey}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      initialNumToRender={4} maxToRenderPerBatch={4} windowSize={5} updateCellsBatchingPeriod={40}
      removeClippedSubviews={Platform.OS === 'android'} ItemSeparatorComponent={MushroomRowSeparator}
      style={styles.collectionScroll} contentContainerStyle={[s.page, styles.collectionContent]}
      ListHeaderComponent={traitsActive ? <View style={[styles.traitResults, styles.listHeader]}>
      <View style={styles.traitResultsHeading}><Text accessibilityLiveRegion="polite" style={styles.traitResultsTitle}>Dopasowania w katalogu: {visible.length}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Usuń filtr cech" onPress={() => setTraitFilters(emptyTraitSelection())} style={styles.clearTraits}>
          <Text style={styles.traitButtonText}>Wyczyść</Text></Pressable>
      </View>
      <Text style={styles.smallCopy}>{traitSelectionLabels(traitFilters).join(' · ')}</Text>
      <Text style={styles.traitNotice}>{identificationNotice}</Text>
    </View> : undefined}
    ListEmptyComponent={<View accessibilityLiveRegion="polite" style={styles.empty}>
      <Text style={styles.sectionTitle}>{traitsActive ? 'Brak dopasowań' : query.trim() ? 'Nie znaleziono grzybów' : filter === 'found' ? 'Pierwsze odkrycie przed Tobą' : 'Kolekcja kompletna'}</Text>
      <Copy>{traitsActive ? 'Zmień lub pomiń cechę. Możesz też usunąć nazwę z wyszukiwania lub wybrać „Wszystkie”. Brak dopasowania nie rozstrzyga, jaki to gatunek.' : query.trim() ? 'Spróbuj krótszej nazwy, nazwy potocznej lub filtra „Wszystkie”.'
        : filter === 'found' ? 'Pierwsza zatwierdzona sztuka doda grzyba do odkrytych i odblokuje pierwszą rangę.' : 'Masz już wszystkie gatunki. Kolejne sztuki przybliżają Cię do nowych rang.'}</Copy>
    </View>}
    ListFooterComponent={<View style={styles.listFooter}><Copy>Postęp tworzą Twoje zatwierdzone zbiory. Oczekujące i odrzucone zgłoszenia się nie liczą.</Copy></View>} />
    {traitPickerOpen && <MushroomTraitPicker initial={traitFilters} onClose={() => setTraitPickerOpen(false)} onApply={selection => {
      setTraitFilters(selection); setFilter('all'); setQuery(''); setSearchOpen(false); setTraitPickerOpen(false);
    }} />}
  </SafeAreaView>;
}

function MushroomRow({ entries }: { entries: MushroomGridRow }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.gridRow}>
    {entries.map(({ mushroom, total }) => <MushroomTile key={mushroom.id} mushroom={mushroom} total={total} />)}
    {entries.length === 1 && <View style={styles.tileSpacer} />}
  </View>;
}

// Scroll cells do not need an animation controller per tile. Stable scalar props
// also keep typing and unrelated room updates from rebuilding unchanged photos.
const MushroomTile = memo(function MushroomTile({ mushroom, total }: MushroomGridEntry) {
  const styles = useThemedStyles(createStyles);
  const progress = useMemo(() => badgeProgress(total), [total]);
  const unlocked = total > 0;
  return <NativePressable accessibilityRole="button" accessibilityLabel={`Zobacz ${mushroom.label}`}
    accessibilityHint={unlocked ? `${total} znalezionych sztuk. Otwiera statystyki, rangę i notatkę.` : 'Gatunek nieodkryty. Otwiera kolorowe zdjęcie i notatkę. Pierwsza zatwierdzona sztuka usuwa kłódkę z kafelka.'}
    onPress={() => router.push({ pathname: '/grzybdex/[id]', params: { id: mushroom.id } })}
    style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
    <MushroomTilePhoto mushroom={mushroom} unlocked={unlocked} />
    <View style={styles.tileBody}>
      <Text numberOfLines={2} style={styles.tileTitle}>{mushroom.label}</Text>
      {unlocked ? <>
        <View style={styles.tileCountRow}><View style={styles.tileQuantity}><Text style={styles.tileCount}>{total}</Text><Text style={styles.tileCopy}>szt.</Text></View>
          <Text style={styles.tileCopy}>{progress.current?.name}</Text></View>
        <View accessibilityRole="progressbar" accessibilityLabel={progress.next ? `Do rangi ${progress.next.name}` : 'Najwyższa ranga zdobyta'}
          aria-valuemin={0} aria-valuemax={progress.next?.threshold ?? total} aria-valuenow={total} style={styles.tileTrack}>
          <View style={[styles.tileFill, { width: `${progress.percent}%` }]} />
        </View>
        <Text style={styles.tileCopy}>{progress.next ? `${progress.remaining} do ${nextBadgeLabel[progress.next.id]}` : 'Najwyższa ranga'}</Text>
      </> : <><Text style={styles.tileCopy}>Jeszcze nieodkryty</Text><Text style={styles.tileCopy}>Znajdź pierwszą sztukę</Text></>}
    </View>
  </NativePressable>;
});

export function MushroomDetailsScreen() {
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const collection = useCollection();
  const reducedMotion = useReducedMotion();
  const mushroom = mushroomCatalog.find(item => item.id === id);
  if (!mushroom) return <Page><Title>Nie znaleziono grzyba</Title><Copy>Wybierz gatunek ze swojej kolekcji.</Copy>
    <Button title="Wróć do Grzybedexu" onPress={() => router.replace('/grzybdex')} /></Page>;
  const stats = collection.find(entry => entry.species === mushroom.name)!;
  return <Page>
    <Stack.Screen options={{ title: mushroom.label }} />
    <View style={styles.intro}><Text style={styles.eyebrow}>KARTA GRZYBA</Text><Title>{mushroom.label}</Title><Copy>{mushroom.scientificName}</Copy></View>
    <View style={styles.heroPhotoFrame}>
      <Image source={mushroom.photo} transition={reducedMotion ? 0 : 220} contentFit="contain" accessibilityLabel={`Zdjęcie: ${mushroom.label}`} style={styles.heroPhoto} />
    </View>
    <EdibilityCard mushroomId={mushroom.id} />
    <MotionView distance={0} style={styles.noteCard}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>O grzybie</Text>
      <Copy>{mushroom.note}</Copy>
      <Link href={mushroom.noteSource.url} style={styles.sourceLink}>Źródło notatki: {mushroom.noteSource.label} ↗</Link>
    </MotionView>
    <View style={styles.statRow}>
      <View style={styles.statCard}><Text style={styles.statNumber}>{stats.total}</Text><Text style={styles.statLabel}>Łącznie znaleziono</Text><Text style={styles.smallCopy}>sztuk tego gatunku</Text></View>
      <View style={styles.statCard}><Text style={styles.statNumber}>{stats.bestTrip}</Text><Text style={styles.statLabel}>Rekord na wyprawie</Text><Text style={styles.smallCopy}>sztuk podczas jednej wyprawy</Text></View>
    </View>
    <Copy>Wyprawy z tym gatunkiem: {stats.trips}. Liczymy sztuki z Twoich zatwierdzonych zgłoszeń.</Copy>
    <BadgeProgress stats={stats} />
    <View style={styles.credit}><Text style={styles.smallCopy}>Zdjęcie: {mushroom.author}</Text>
      <Link href={mushroom.source} style={styles.sourceLink}>Źródło zdjęcia ↗</Link>
      <Link href={mushroomTraits[mushroom.id].source.url} style={styles.sourceLink}>Źródło cech w filtrze: {mushroomTraits[mushroom.id].source.label} ↗</Link>
      <Link href={mushroom.licenseUrl} style={styles.sourceLink}>Licencja: {mushroom.license} ↗</Link></View>
  </Page>;
}

function EdibilityCard({ mushroomId }: { mushroomId: string }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const edibility = mushroomEdibility[mushroomId];
  const status = edibility?.status;
  const unsafe = status === 'inedible' || status === 'poisonous';
  const color = status === 'edible' ? colors.navigationActive : status === 'conditional' ? colors.gold
    : unsafe ? colors.danger : colors.textMuted;
  return <MotionView distance={0} style={styles.noteCard}>
    <View style={styles.edibilityHeader}>
      <Text accessibilityRole="header" style={styles.edibilityTitle}>Jadalność</Text>
      <View style={[styles.edibilityBadge, { borderColor: color }]}>
        {status === 'edible' ? <CheckIcon size={16} color={color} />
          : unsafe ? <ExclamationIcon size={16} color={color} /> : <InfoIcon size={16} color={color} />}
        <Text style={[styles.edibilityLabel, { color }]}>{status ? edibilityLabels[status] : 'Niezweryfikowana'}</Text>
      </View>
    </View>
    {edibility?.note && <Copy>{edibility.note}</Copy>}
    <Text style={styles.smallCopy}>{edibilityNotice}</Text>
    {edibility && <Link href={edibility.source.url} style={styles.sourceLink}>Źródło jadalności: {edibility.source.label} ↗</Link>}
  </MotionView>;
}

const MushroomTilePhoto = memo(function MushroomTilePhoto({ mushroom, unlocked }: { mushroom: typeof mushroomCatalog[number]; unlocked: boolean }) {
  const styles = useThemedStyles(createStyles);
  const filterId = `grzybedex-gray-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const top = mushroom.id === 'podgrzybek';
  return <View style={styles.tilePhoto}>
    {Platform.OS === 'ios' && !unlocked ? <Svg width="100%" height="100%" viewBox="0 0 160 100" accessible={false}>
      {/* Native View grayscale is Android-only; SVG supplies the same effect on iOS. */}
      <Defs><Filter id={filterId} x="0%" y="0%" width="100%" height="100%">
        <FeColorMatrix type="saturate" values="0" />
      </Filter></Defs>
      <SvgImage href={mushroom.photo} width={160} height={100} preserveAspectRatio={top ? 'xMidYMin slice' : 'xMidYMid slice'} filter={`url(#${filterId})`} />
    </Svg> : <View style={[StyleSheet.absoluteFill, !unlocked && styles.grayscalePhoto]}>
      <Image accessible={false} source={mushroom.photo} contentFit="cover" contentPosition={top ? 'top' : 'center'}
        allowDownscaling enforceEarlyResizing cachePolicy="memory-disk" decodeFormat="rgb" recyclingKey={mushroom.id}
        transition={0} style={StyleSheet.absoluteFill} />
    </View>}
    {!unlocked && <View pointerEvents="none" style={styles.lockOverlay}>
      <View style={styles.lockBadge}><LockIcon size={24} color="#E2E2E2" /></View>
    </View>}
  </View>;
});

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
  collectionHeader: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 20, paddingBottom: 12, gap: 16, flexShrink: 0 },
  collectionScroll: { flex: 1 },
  collectionContent: { paddingTop: 0, gap: 0 },
  listHeader: { marginBottom: 20 },
  listFooter: { paddingTop: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  searchButton: { width: 44, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  search: { gap: 6 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12, borderWidth: 1, borderColor: c.borderStrong,
    borderRadius: 12, backgroundColor: c.surface },
  searchInput: { flex: 1, minWidth: 0, minHeight: 48, padding: 12, fontSize: 14, color: c.text },
  collectionTitle: { flex: 1, minWidth: 0, color: c.text, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8 },
  traitButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: c.borderStrong },
  traitButtonActive: { backgroundColor: c.navigationSurface, borderColor: c.navigationActive },
  traitButtonText: { color: c.textSecondary, fontSize: 11, lineHeight: 17, fontWeight: '500' },
  traitResults: { gap: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.border },
  traitResultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  traitResultsTitle: { flex: 1, color: c.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  clearTraits: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  traitNotice: { color: c.textMuted, fontSize: 11, lineHeight: 18 },
  intro: { gap: 8 },
  eyebrow: { color: c.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },
  summary: { flexDirection: 'row', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.border },
  summaryItem: { flex: 1, gap: 4 },
  summaryNumber: { color: c.text, fontSize: 24, lineHeight: 29, fontWeight: '600', letterSpacing: -0.6 },
  filters: { flexDirection: 'row', gap: 4 },
  filter: { paddingHorizontal: 10, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterSelected: { backgroundColor: c.accentSurface },
  filterLabel: { color: c.textMuted, fontSize: 12, fontWeight: '500' },
  filterLabelSelected: { color: c.text, fontWeight: '600' },
  smallCopy: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
  gridRow: { flexDirection: 'row', gap: 12 },
  tileSpacer: { flex: 1, minWidth: 0 },
  tile: { flex: 1, minWidth: 0, borderRadius: 18, overflow: 'hidden', backgroundColor: c.surface },
  tilePhoto: { width: '100%', aspectRatio: 1.6, backgroundColor: c.photoPlaceholder },
  grayscalePhoto: { filter: 'grayscale(1)' },
  lockOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.16)' },
  lockBadge: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(35, 35, 35, 0.78)' },
  tileBody: { padding: 12, gap: 8 },
  tileTitle: { color: c.text, fontSize: 14, lineHeight: 19, minHeight: 38, fontWeight: '600' },
  tileCountRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  tileQuantity: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  tileCount: { color: c.text, fontSize: 20, lineHeight: 24, fontWeight: '600', letterSpacing: -0.5 },
  tileCopy: { color: c.textMuted, fontSize: 11, lineHeight: 15 },
  tileTrack: { height: 3, borderRadius: 3, overflow: 'hidden', backgroundColor: c.surfaceRaised },
  tileFill: { height: '100%', borderRadius: 3, backgroundColor: c.progress },
  empty: { gap: 12, paddingVertical: 24 },
  heroPhotoFrame: { borderRadius: 18, overflow: 'hidden', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  heroPhoto: { width: '100%', height: 260 },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, gap: 7 },
  statNumber: { color: c.text, fontSize: 32, fontWeight: '600', letterSpacing: -1 },
  statLabel: { color: c.text, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  sectionTitle: { color: c.text, fontSize: 21, fontWeight: '700' },
  noteCard: { padding: 18, gap: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16 },
  edibilityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  edibilityTitle: { color: c.text, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  edibilityBadge: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  edibilityLabel: { flexShrink: 1, fontSize: 12, lineHeight: 18, fontWeight: '600' },
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
