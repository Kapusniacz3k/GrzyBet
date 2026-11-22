import { StyleSheet, Text, View } from 'react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import type { AppColors } from '@/constants/app-theme';
import { PeopleIcon } from '@/components/grzybet-icons';
import { useThemedStyles, useAppTheme } from '@/hooks/use-app-theme';
import { isTerminalRoom, memberName, statusLabel, type Room } from './domain';
import { useGame } from './game-context';
import { MotionPressable as Pressable } from '@/components/motion';
import { Button, Card, Copy, Message } from './ui';

export function RoomHeader({ room, title }: { room: Room; title?: string }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const { userId, cancel, leave, busy } = useGame();
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const host = room.host === userId;
  const canManage = !isTerminalRoom(room) && (host || room.phase === 'lobby');
  async function apply() {
    if (inFlight.current || busy) return;
    inFlight.current = true; setPending(true); setError('');
    try {
      if (host) { await cancel(room.id); setConfirm(false); }
      else { await leave(room.id); router.dismissTo('/home'); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Nie udało się zmienić wyprawy.'); }
    finally { inFlight.current = false; setPending(false); }
  }
  return <View style={styles.header}>
    <View style={styles.statusRow}>
      <View style={styles.statusDot} /><Text style={styles.status}>{statusLabel(room)}</Text>
      <Text style={styles.mode}>{room.gameMode === 'coupons' ? 'Kupony' : 'Typowanie'}</Text>
    </View>
    <Text accessibilityRole="header" style={styles.title}>{title ?? (room.phase === 'predicting' ? 'Twoje typowanie' : room.name)}</Text>
    <View style={styles.meta}>
      <PeopleIcon size={15} color={colors.textMuted} />
      <Text style={styles.metaCopy}>{room.members.length} w ekipie · Organizator: {memberName(room, room.host)}</Text>
      {canManage && <Pressable accessibilityRole="button" accessibilityLabel={host ? 'Anuluj wyprawę' : 'Opuść lobby'}
        disabled={busy || pending} onPress={() => { setConfirm(value => !value); setError(''); }} style={styles.manageButton}>
        <Text style={styles.manageLabel}>{host ? 'Anuluj' : 'Opuść'}</Text>
      </Pressable>}
    </View>
    {canManage && confirm && <Card>
      <Copy>{host ? 'Anulować wyprawę? Wyniki nie będą rozliczone. Zatwierdzone zbiory pozostaną w Grzybedexie, a wyprawa w historii. Nie można tego cofnąć.'
        : 'Opuścić lobby? Przestaniesz zajmować miejsce w ekipie. Możesz ponownie dołączyć kodem, dopóki organizator nie rozpocznie gry.'}</Copy>
      <Button title={pending ? 'Chwileczkę…' : host ? 'Potwierdź anulowanie wyprawy' : 'Potwierdź opuszczenie lobby'} disabled={busy || pending} onPress={() => { void apply(); }} />
      <Button title="Wróć do wyprawy" secondary disabled={busy || pending} onPress={() => setConfirm(false)} />
      <Message text={error} />
    </Card>}
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  header: { gap: 10, paddingBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.navigationActive },
  status: { flex: 1, color: c.textMuted, fontSize: 11, lineHeight: 18, fontWeight: '500' },
  mode: { color: c.textMuted, fontSize: 11, lineHeight: 18 },
  title: { color: c.text, fontSize: 26, lineHeight: 33, letterSpacing: -0.8, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaCopy: { flex: 1, color: c.textMuted, fontSize: 12, lineHeight: 19 },
  manageButton: { minHeight: 44, minWidth: 54, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  manageLabel: { color: c.textMuted, fontSize: 12, textDecorationLine: 'underline' },
});
