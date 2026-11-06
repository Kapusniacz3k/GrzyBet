import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckIcon, ExclamationIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable, MotionView } from '@/components/motion';
import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import type { Account } from './account-context';
import { canDeleteAccount, deletionSecondsRemaining } from './account-deletion';
import { Button, Copy, Field, Message } from './ui';

export function DeleteAccountAction({ account }: { account: Account }) {
  const styles = useThemedStyles(createStyles);
  const [visible, setVisible] = useState(false);
  return <View style={styles.actionSection}>
    <Pressable accessibilityRole="button" disabled={account.busy} accessibilityState={{ disabled: account.busy }}
      onPress={() => setVisible(true)} style={({ pressed }) => [styles.textAction, (pressed || account.busy) && styles.dimmed]}>
      <Text style={styles.dangerText}>{account.isGuest ? 'Usuń profil gościa' : 'Usuń konto'}</Text>
    </Pressable>
    {visible && <DeleteAccountModal account={account} onClose={() => setVisible(false)} />}
  </View>;
}

function DeleteAccountModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const reducedMotion = useReducedMotion();
  const [openedAt] = useState(Date.now);
  const [now, setNow] = useState(openedAt);
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const busy = account.busy || submitting;
  const seconds = deletionSecondsRemaining(openedAt, now);
  const allowed = canDeleteAccount(openedAt, now, confirmed, busy) && (!needsPassword || password.length > 0);

  useEffect(() => {
    const timer = setInterval(() => {
      const timestamp = Date.now();
      setNow(timestamp);
      if (deletionSecondsRemaining(openedAt, timestamp) === 0) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [openedAt]);

  function close() { if (!busy && !inFlight.current) onClose(); }
  async function remove() {
    // Recheck the deadline at activation, including keyboard and accessibility actions.
    if (inFlight.current || !canDeleteAccount(openedAt, Date.now(), confirmed, busy) || (needsPassword && !password)) return;
    inFlight.current = true; setSubmitting(true); setError('');
    try { await account.remove(needsPassword ? password : undefined); }
    catch (error) {
      if ((error as { code?: string }).code === 'auth/requires-recent-login') setNeedsPassword(true);
      setError(error instanceof Error ? error.message : 'Nie udało się usunąć konta. Spróbuj ponownie.');
    } finally { setPassword(''); inFlight.current = false; setSubmitting(false); }
  }

  return <Modal visible transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={close} accessibilityLabel="Potwierdzenie usunięcia konta">
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable accessible={false} importantForAccessibility="no" onPress={close} style={StyleSheet.absoluteFill} />
        <MotionView accessibilityViewIsModal onAccessibilityEscape={close} style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll} contentContainerStyle={styles.content}>
            <ExclamationIcon size={32} color={colors.danger} />
            <Text accessibilityRole="header" style={styles.title}>{account.isGuest ? 'Usunąć profil gościa?' : 'Usunąć konto?'}</Text>
            {!!account.email && <Text selectable style={styles.email}>{account.email}</Text>}
            <Copy>Ta operacja jest nieodwracalna. Stracisz dostęp do tego profilu, swoich wypraw, odznak i Grzybedexu.</Copy>
            <Text style={styles.note}>Wspólne wyprawy, wyniki i zgłoszone zdjęcia pozostaną u uczestników. Przed usunięciem zakończ wyprawy, które prowadzisz.</Text>
            <Pressable accessibilityRole="checkbox" aria-checked={confirmed} accessibilityState={{ checked: confirmed, disabled: busy }}
              disabled={busy} onPress={() => setConfirmed(value => !value)} style={styles.confirmation}>
              <View style={[styles.checkbox, confirmed && styles.checked]}>{confirmed && <CheckIcon size={15} color={colors.onPrimary} />}</View>
              <Text style={styles.confirmationText}>Rozumiem konsekwencje i chcę trwale usunąć {account.isGuest ? 'profil gościa' : 'konto'}.</Text>
            </Pressable>
            {needsPassword && <Field label="Potwierdź hasło" value={password} onChangeText={setPassword} secureTextEntry
              autoComplete="current-password" autoCapitalize="none" autoCorrect={false} editable={!busy} onSubmitEditing={() => { void remove(); }} />}
            <Message text={error} />
            <Text accessibilityLiveRegion="polite" style={styles.countdown}>{seconds > 0 ? `Możesz potwierdzić usunięcie za ${seconds} s.`
              : !confirmed ? 'Zaznacz pole potwierdzenia, aby kontynuować.'
                : needsPassword && !password ? 'Wpisz hasło, aby potwierdzić usunięcie.' : 'Możesz teraz potwierdzić usunięcie.'}</Text>
          </ScrollView>
          <View style={styles.buttons}>
            <Pressable accessibilityRole="button" disabled={!allowed} accessibilityState={{ disabled: !allowed, busy }}
              onPress={() => { void remove(); }} style={({ pressed }) => [styles.deleteButton, !allowed && styles.deleteDisabled, pressed && styles.dimmed]}>
              <Text style={[styles.deleteLabel, !allowed && styles.disabledLabel]}>{busy ? 'Usuwanie…' : `${account.isGuest ? 'Usuń profil' : 'Usuń konto'}${seconds > 0 ? ` (${seconds} s)` : ''}`}</Text>
            </Pressable>
            <Button title="Anuluj" secondary disabled={busy} onPress={close} />
          </View>
        </MotionView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  actionSection: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12 },
  textAction: { minHeight: 48, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: c.danger, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  safeArea: { flex: 1, backgroundColor: c.overlay },
  overlay: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 440, maxHeight: '100%', flexShrink: 1, backgroundColor: c.surface, borderRadius: 22, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { padding: 20, gap: 16 },
  title: { color: c.text, fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5 },
  email: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  note: { color: c.textMuted, fontSize: 12, lineHeight: 19 },
  confirmation: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 5, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checked: { borderColor: c.dangerFill, backgroundColor: c.dangerFill },
  confirmationText: { flex: 1, color: c.text, fontSize: 13, lineHeight: 20 },
  countdown: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
  buttons: { borderTopWidth: 1, borderTopColor: c.border, padding: 16, gap: 10 },
  deleteButton: { minHeight: 48, padding: 14, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: c.dangerFill },
  deleteDisabled: { backgroundColor: c.surfaceRaised },
  deleteLabel: { color: c.onPrimary, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  disabledLabel: { color: c.textMuted },
  dimmed: { opacity: 0.5 },
});
