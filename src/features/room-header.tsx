import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '@/constants/app-theme';
import { PeopleIcon } from '@/components/grzybet-icons';
import { useThemedStyles, useAppTheme } from '@/hooks/use-app-theme';
import { memberName, statusLabel, type Room } from './domain';

export function RoomHeader({ room, title }: { room: Room; title?: string }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  return <View style={styles.header}>
    <View style={styles.statusRow}>
      <View style={styles.statusDot} /><Text style={styles.status}>{statusLabel(room)}</Text>
      <Text style={styles.mode}>{room.gameMode === 'coupons' ? 'Kupony' : 'Typowanie'}</Text>
    </View>
    <Text accessibilityRole="header" style={styles.title}>{title ?? (room.phase === 'predicting' ? 'Twoje typowanie' : room.name)}</Text>
    <View style={styles.meta}>
      <PeopleIcon size={15} color={colors.textMuted} />
      <Text style={styles.metaCopy}>{room.members.length} w ekipie · Organizator: {memberName(room, room.host)}</Text>
    </View>
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
});
