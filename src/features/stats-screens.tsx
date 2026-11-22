import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowIcon, CloseIcon, HistoryIcon, PeopleIcon, SettingsIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable } from '@/components/motion';
import { calculateResults, memberName, statusLabel, useGame, type Room } from './game';
import { predictionStartLabel, roomDateLabel } from './room-timing';
import { DeleteAccountAction } from './delete-account-modal';
import { Button, Page } from './ui';
import { useAccount } from './account-context';
import { speciesLabel } from './mushroom-species';
import { calculateCouponResults, couponWallet, formatGrzybki } from './coupons';
import { ownTripSections } from './home-summary';

function seasonStats(rooms: Room[]) {
  const stats = new Map<string, { name: string; points: number; wins: number; mushrooms: number }>();
  for (const room of rooms.filter(r => r.joined && r.phase === 'finished')) {
    const couponResults = new Map(calculateCouponResults(room).map(row => [row.member, row]));
    for (const result of calculateResults(room)) {
      const row = stats.get(result.member) ?? { name: result.member, points: 0, wins: 0, mushrooms: 0 };
      if (room.gameMode !== 'coupons') row.points += result.points;
      row.mushrooms += result.mushrooms;
      if (room.gameMode !== 'coupons' && result.place === 1 && result.points > 0) row.wins++;
      if (room.gameMode === 'coupons') {
        const couponResult = couponResults.get(result.member);
        if (couponResult?.place === 1 && couponResult.netCents > 0) row.wins++;
      }
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
  const [tripList, setTripList] = useState<'active' | 'history' | null>(null);
  const { activeTrips, finishedTrips, history } = ownTripSections(rooms, userId);
  const stats = seasonStats(finishedTrips).find(r => r.name === userId);
  const best = Math.max(0, ...finishedTrips.flatMap(r => calculateResults(r).filter(row => row.member === userId).map(row => row.mushrooms)));
  const currentTicket = (room: Room) => room.tickets[userId] ?? room.ticket;
  const ticketCount = (room: Room) => room.gameMode === 'coupons' ? couponWallet(room, userId).slips.length : currentTicket(room) ? 1 : 0;
  const activeTickets = activeTrips.filter(room => ticketCount(room) > 0);
  function open(id: string) { setTripList(null); router.push({ pathname: '/room/[id]', params: { id } }); }
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
        <View accessible accessibilityLabel={`Punkty za typowanie z zakończonych wypraw: ${stats?.points ?? 0}`} style={styles.highlight}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.highlightValue}>{stats?.points ?? 0}</Text>
          <Text style={styles.highlightLabel}>Punkty za typowanie</Text>
        </View>
      </View>
      <Text style={styles.statsHint}>Z zakończonych wypraw</Text>
      <View style={styles.metrics}>
        <ProfileMetric value={finishedTrips.length} label="Wyprawy" description="Zakończone wyprawy" />
        <ProfileMetric divider value={stats?.wins ?? 0} label="Wygrane" description="Wygrane wyprawy z dodatnim wynikiem" />
        <ProfileMetric divider value={best} label="Rekord" description="Grzyby na najlepszej wyprawie" />
        <ProfileMetric divider value={[...activeTrips, ...finishedTrips].reduce((sum, room) => sum + ticketCount(room), 0)} label="Kupony" description="Zapisane kupony" />
      </View>
      </View>
    </View>

    <View style={styles.tripShortcuts}>
      <Pressable accessibilityRole="button" accessibilityLabel="Aktywne wyprawy" aria-expanded={tripList === 'active'}
        accessibilityHint={`Otwiera okno z aktywnymi wyprawami. Na liście: ${activeTrips.length}.`}
        onPress={() => setTripList('active')} style={({ pressed }) => [styles.tripShortcut, pressed && styles.pressed]}>
        <View style={styles.shortcutHeading}><PeopleIcon size={21} color={colors.textMuted} /><Text style={styles.count}>{activeTrips.length}</Text></View>
        <Text style={styles.shortcutLabel}>Aktywne wyprawy</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Historia wypraw" aria-expanded={tripList === 'history'}
        accessibilityHint={`Otwiera okno z historią wypraw. Na liście: ${history.length}.`}
        onPress={() => setTripList('history')} style={({ pressed }) => [styles.tripShortcut, pressed && styles.pressed]}>
        <View style={styles.shortcutHeading}><HistoryIcon size={21} color={colors.textMuted} /><Text style={styles.count}>{history.length}</Text></View>
        <Text style={styles.shortcutLabel}>Historia wypraw</Text>
      </Pressable>
    </View>
    <View style={styles.tickets}>
      <View style={styles.sectionHeading}><Text accessibilityRole="header" style={styles.sectionTitle}>Aktywne kupony</Text><Text style={styles.smallCopy}>{activeTickets.reduce((sum, room) => sum + ticketCount(room), 0)}</Text></View>
      {!!activeTickets.length && <View style={styles.ticketList}>{activeTickets.map(room => {
        const ticket = currentTicket(room);
        return <Pressable key={room.id} accessibilityRole="button" accessibilityLabel={`Otwórz pokój ${room.name}`}
        onPress={() => open(room.id)} style={({ pressed }) => [styles.ticket, pressed && styles.pressed]}>
        <View style={styles.tripText}><Text style={styles.tripName}>{room.name}</Text><Text style={styles.smallCopy}>{room.gameMode === 'coupons'
          ? `${ticketCount(room)} kuponów · ${10 - couponWallet(room, userId).spent} grzybków do wykorzystania`
          : `${ticket ? memberName(room, ticket.winner) : ''} · ${ticket ? speciesLabel(ticket.species) : ''}`}</Text></View>
        <ArrowIcon size={19} direction="up-right" color={colors.textMuted} />
      </Pressable>;
      })}</View>}
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
    {tripList && <ProfileTripsModal kind={tripList} rooms={tripList === 'active' ? activeTrips : history} userId={userId}
      onClose={() => setTripList(null)} onOpen={open} />}
  </Page>;
}

function ProfileTripsModal({ kind, rooms, userId, onClose, onOpen }: {
  kind: 'active' | 'history'; rooms: Room[]; userId: string; onClose: () => void; onOpen: (id: string) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const reducedMotion = useReducedMotion();
  const active = kind === 'active';
  const title = active ? 'Aktywne wyprawy' : 'Historia wypraw';
  return <Modal visible transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose} accessibilityLabel={title}>
    <SafeAreaView style={styles.modalOverlay}>
      <View accessibilityViewIsModal onAccessibilityEscape={onClose} style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeading}><Text accessibilityRole="header" style={styles.modalTitle}>{title}</Text>
            <Text style={styles.smallCopy}>Na liście: {rooms.length}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={active ? 'Zamknij aktywne wyprawy' : 'Zamknij historię wypraw'}
            onPress={onClose} style={styles.modalClose}><CloseIcon size={18} color={colors.textMuted} /></Pressable>
        </View>
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
          {!rooms.length && <View style={styles.emptyTrips}>
            {active ? <PeopleIcon size={30} color={colors.textMuted} /> : <HistoryIcon size={30} color={colors.textMuted} />}
            <Text style={styles.copy}>{active ? 'Nie masz teraz aktywnych wypraw.' : 'Zakończone i anulowane wyprawy pojawią się tutaj.'}</Text>
          </View>}
          {rooms.map(room => {
            if (active) return <Pressable key={room.id} accessibilityRole="button"
              accessibilityLabel={`Otwórz wyprawę ${room.name}, ${statusLabel(room)}`} onPress={() => onOpen(room.id)}
              style={({ pressed }) => [styles.activeTrip, pressed && styles.pressed]}>
              <View style={styles.tripText}><Text style={styles.tripName}>{room.name}</Text>
                <Text style={styles.smallCopy}>{statusLabel(room)} · Uczestnicy: {room.members.length}</Text></View>
              <ArrowIcon size={19} direction="right" color={colors.textMuted} />
            </Pressable>;
            if (room.phase === 'cancelled') return <Pressable key={room.id} accessibilityRole="button"
              accessibilityLabel={`Otwórz anulowaną wyprawę ${room.name}`} onPress={() => onOpen(room.id)}
              style={({ pressed }) => [styles.historyItem, pressed && styles.pressed]}>
              <View style={styles.tripHeading}>
                <View style={styles.tripText}><Text style={styles.tripName}>{room.name}</Text><Text style={styles.smallCopy}>{roomDateLabel(room.date)}</Text></View>
                <Text style={styles.place}>Anulowano</Text><ArrowIcon size={19} direction="right" color={colors.textMuted} />
              </View>
            </Pressable>;
            const result = calculateResults(room).find(row => row.member === userId);
            const couponResult = room.gameMode === 'coupons' ? calculateCouponResults(room).find(row => row.member === userId) : undefined;
            if (!result) return null;
            return <Pressable key={room.id} accessibilityRole="button" accessibilityLabel={`Podsumowanie wyprawy ${room.name}`}
              onPress={() => onOpen(room.id)} style={({ pressed }) => [styles.historyItem, pressed && styles.pressed]}>
              <View style={styles.tripHeading}>
                <View style={styles.tripText}><Text style={styles.tripName}>{room.name}</Text>
                  <Text style={styles.smallCopy}>{roomDateLabel(room.date)}{room.predictionStartedAt ? ` · start ${predictionStartLabel(room.date, room.predictionStartedAt)}` : ''}</Text></View>
                <Text style={styles.place}>{couponResult?.place ?? result.place}. miejsce</Text>
              </View>
              <View style={styles.tripFooter}>
                <Text style={styles.tripResult}>{couponResult ? `${formatGrzybki(couponResult.balanceCents)} grzybków · Kupony` : `${result.points} pkt`} · {result.mushrooms} grzybów</Text>
                <ArrowIcon size={19} direction="up-right" color={colors.textMuted} />
              </View>
            </Pressable>;
          })}
        </ScrollView>
        <View style={styles.modalFooter}><Button title="Zamknij" secondary onPress={onClose} /></View>
      </View>
    </SafeAreaView>
  </Modal>;
}

function ProfileMetric({ value, label, description, divider = false }: { value: number; label: string; description: string; divider?: boolean }) {
  const styles = useThemedStyles(createStyles);
  return <View accessible accessibilityLabel={`${description}: ${value}`} style={[styles.metric, divider && styles.metricDivider]}>
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  page: { gap: 24, paddingTop: 16 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  pageTitle: { flex: 1, color: c.text, fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.8 },
  settings: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: c.avatar, alignItems: 'center', justifyContent: 'center' },
  initial: { color: c.avatarText, fontSize: 25, fontWeight: '600' },
  identityText: { flex: 1, minWidth: 0, gap: 6 },
  nickname: { color: c.text, fontSize: 25, lineHeight: 32, fontWeight: '600', letterSpacing: -0.6 },
  modeLabel: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
  statistics: { gap: 12 },
  sectionTitle: { color: c.text, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  summaryCard: { borderRadius: 18, backgroundColor: c.surface, padding: 18, gap: 16 },
  highlights: { flexDirection: 'row', gap: 18 },
  highlight: { flex: 1, minWidth: 0, gap: 5 },
  highlightValue: { color: c.text, fontSize: 34, lineHeight: 42, fontWeight: '600', letterSpacing: -1 },
  highlightLabel: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
  statsHint: { color: c.textMuted, fontSize: 11, lineHeight: 17 },
  metrics: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16 },
  metric: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5, paddingHorizontal: 4 },
  metricDivider: { paddingLeft: 8 },
  metricValue: { maxWidth: '100%', color: c.text, fontSize: 19, lineHeight: 25, fontWeight: '600', letterSpacing: -0.3 },
  metricLabel: { color: c.textMuted, fontSize: 11, lineHeight: 16 },
  tripShortcuts: { flexDirection: 'row', gap: 12 },
  tripShortcut: { flex: 1, minWidth: 0, minHeight: 96, padding: 14, justifyContent: 'space-between', gap: 12,
    borderWidth: 1, borderColor: c.border, borderRadius: 14 },
  shortcutHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  shortcutLabel: { color: c.text, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  count: { color: c.textMuted, fontSize: 12 },
  modalOverlay: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.overlay },
  modalCard: { width: '100%', maxWidth: 480, maxHeight: '90%', flexShrink: 1, backgroundColor: c.surface,
    borderRadius: 22, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  modalHeading: { flex: 1, minWidth: 0, gap: 6 },
  modalTitle: { color: c.text, fontSize: 21, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  modalClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  modalScroll: { flexGrow: 0, flexShrink: 1 },
  modalContent: { paddingHorizontal: 18, paddingBottom: 4 },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: c.border },
  emptyTrips: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 },
  historyItem: { borderTopWidth: 1, borderTopColor: c.border, paddingVertical: 16, gap: 12 },
  activeTrip: { minHeight: 64, borderTopWidth: 1, borderTopColor: c.border, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  accountCard: { borderRadius: 18, backgroundColor: c.surface, padding: 18, gap: 10 },
  accountLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  pressed: { opacity: 0.6 },
});
