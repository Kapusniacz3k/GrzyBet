import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckIcon, LockIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable } from '@/components/motion';
import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { accountEmail, validateNewPassword } from '@/services/email-auth';
import { useAccount, type Account } from './account-context';
import { DeleteAccountAction } from './delete-account-modal';
import { Button, Copy, Field, Message, Page, Title } from './ui';

type FormMode = 'register' | 'login' | 'reset';
const resetMessage = 'Jeśli konto z tym adresem istnieje, otrzymasz e-mail z linkiem do zmiany hasła. Sprawdź też folder spam.';

export function AccountScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const account = useAccount();
  const initialMode = mode === 'login' || mode === 'reset' ? mode : 'register';
  return <Page>
    {account ? <AccountForm key={initialMode} initialMode={initialMode} /> : <>
      <Title>Konto online</Title><Copy>Logowanie jest dostępne w wersji online GrzyBet.</Copy>
      <Button title="Wróć do profilu" secondary onPress={() => router.replace('/profile')} />
    </>}
  </Page>;
}

export function AccountForm({ initialMode = 'register', allowRegistration = true, onCancel }: { initialMode?: FormMode; allowRegistration?: boolean; onCancel?: () => void }) {
  const account = useAccount();
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const [mode, setMode] = useState<FormMode>(initialMode);
  const [email, setEmail] = useState(account?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  if (!account) return null;
  const busy = account.busy || submitting;

  function changeMode(next: FormMode) {
    setMode(next); setPassword(''); setConfirmation(''); setShowPassword(false); setMessage(''); setAcknowledged(false);
  }
  async function submit() {
    if (busy || submittingRef.current || !account) return;
    setMessage('');
    try {
      accountEmail(email);
      if (mode === 'register') validateNewPassword(password, confirmation);
      if (mode === 'login' && account.hasGuestProgress && !acknowledged) throw new Error('Potwierdź przejście na istniejące konto lub zabezpiecz obecny profil gościa.');
      submittingRef.current = true; setSubmitting(true);
      if (mode === 'reset') {
        await account.resetPassword(email);
        setMessage(resetMessage);
      } else if (mode === 'register') {
        await account.register(email, password, confirmation);
        setPassword(''); setConfirmation('');
        setMessage('Konto zabezpieczone. Twoje wyprawy, odznaki i Grzybedex zostały zachowane.');
      } else {
        await account.signIn(email, password);
        setPassword('');
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Nie udało się wykonać operacji. Spróbuj ponownie.'); }
    finally { submittingRef.current = false; setSubmitting(false); }
  }

  if (!account.isGuest && mode !== 'reset') return <AccountDetails account={account} message={message} onReset={() => { setEmail(account.email); changeMode('reset'); }} />;

  return <View style={styles.form}>
    <View style={styles.intro}>
      <Text style={styles.eyebrow}>TWOJE KONTO</Text>
      <Title>{mode === 'register' ? 'Zabezpiecz konto' : mode === 'login' ? 'Witaj ponownie' : 'Resetowanie hasła'}</Title>
      <Copy>{mode === 'register' ? 'Przypisz e-mail i hasło do obecnego profilu. Zachowasz swoje wyprawy, odznaki i Grzybedex także po zmianie telefonu.'
        : mode === 'login' ? 'Zaloguj się, żeby wrócić do swoich wypraw i leśnej kolekcji.'
          : 'Podaj adres swojego konta. Wyślemy link do ustawienia nowego hasła.'}</Copy>
    </View>
    <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" inputMode="email"
      autoComplete="email" autoCapitalize="none" autoCorrect={false} editable={!busy} maxLength={254} />
    {mode !== 'reset' && <>
      <Field label="Hasło" value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'} autoCapitalize="none" autoCorrect={false}
        editable={!busy} onSubmitEditing={mode === 'login' ? () => { void submit(); } : undefined} />
      {mode === 'register' && <>
        <Text style={styles.hint}>Co najmniej 8 znaków.</Text>
        <Field label="Powtórz hasło" value={confirmation} onChangeText={setConfirmation} secureTextEntry={!showPassword}
          autoComplete="new-password" autoCapitalize="none" autoCorrect={false} editable={!busy} onSubmitEditing={() => { void submit(); }} />
      </>}
      <Pressable accessibilityRole="checkbox" aria-checked={showPassword} accessibilityState={{ checked: showPassword, disabled: busy }}
        disabled={busy} onPress={() => setShowPassword(value => !value)} style={styles.checkRow}>
        <View style={[styles.checkbox, showPassword && styles.checked]}>{showPassword && <CheckIcon size={14} color={colors.onPrimary} />}</View>
        <Text style={styles.link}>Pokaż hasło</Text>
      </Pressable>
    </>}
    {mode === 'login' && account.hasGuestProgress && <View style={styles.notice}>
      <Copy>Obecny gość ma zapisane wyprawy. Ten postęp nie przejdzie na inne konto. Aby go zachować, wybierz „Zabezpiecz konto”.</Copy>
      <Pressable accessibilityRole="checkbox" aria-checked={acknowledged} accessibilityState={{ checked: acknowledged, disabled: busy }}
        disabled={busy} onPress={() => setAcknowledged(value => !value)} style={styles.checkRow}>
        <View style={[styles.checkbox, acknowledged && styles.checked]}>{acknowledged && <CheckIcon size={14} color={colors.onPrimary} />}</View>
        <Text style={[styles.link, styles.flex]}>Chcę przejść na istniejące konto</Text>
      </Pressable>
    </View>}
    <Message text={message} />
    <Button title={busy ? 'Chwileczkę…' : mode === 'register' ? 'Zabezpiecz konto' : mode === 'login' ? 'Zaloguj się' : 'Wyślij link do zmiany hasła'}
      disabled={busy} onPress={() => { void submit(); }} />
    <View style={styles.alternatives}>
      {mode === 'login' && <TextAction title="Nie pamiętam hasła" disabled={busy} onPress={() => changeMode('reset')} />}
      {mode !== 'reset' && allowRegistration && <TextAction title={mode === 'register' ? 'Mam już konto — zaloguj się' : 'Zabezpiecz obecny profil gościa'}
        disabled={busy} onPress={() => changeMode(mode === 'register' ? 'login' : 'register')} />}
      {mode === 'reset' && <TextAction title={account.isGuest ? 'Wróć do logowania' : 'Wróć do konta'} disabled={busy} onPress={() => changeMode('login')} />}
      {onCancel && <TextAction title="Wróć do wyboru nicku" disabled={busy} onPress={onCancel} />}
    </View>
  </View>;
}

function AccountDetails({ account, message, onReset }: { account: Account; message: string; onReset: () => void }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [error, setError] = useState('');
  async function leave() {
    try { await account.signOut(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Nie udało się wylogować.'); }
  }
  return <View style={styles.form}>
    <View style={styles.intro}><LockIcon size={32} color={colors.accent} /><Title>Twoje konto</Title>
      <Text selectable style={styles.email}>{account.email}</Text>
      <Copy>Twoje wyprawy, odznaki i Grzybedex są przypisane do tego konta. Na innym telefonie użyj tego samego e-maila i hasła.</Copy>
    </View>
    <Message text={error || message} />
    <Button title="Przejdź do profilu" disabled={account.busy} onPress={() => router.replace('/profile')} />
    <Button title="Zresetuj hasło" secondary disabled={account.busy} onPress={onReset} />
    {confirmSignOut ? <View style={styles.notice}>
      <Copy>Twoje dane pozostaną na koncie. Po wylogowaniu możesz rozpocząć grę jako gość lub zalogować się ponownie.</Copy>
      <Button title={account.busy ? 'Wylogowywanie…' : 'Wyloguj się'} secondary disabled={account.busy} onPress={() => { void leave(); }} />
      <TextAction title="Anuluj" disabled={account.busy} onPress={() => setConfirmSignOut(false)} />
    </View> : <TextAction title="Wyloguj się" disabled={account.busy} onPress={() => setConfirmSignOut(true)} />}
    <DeleteAccountAction account={account} />
  </View>;
}

function TextAction({ title, disabled, onPress }: { title: string; disabled: boolean; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress}
    style={({ pressed }) => [styles.textAction, (pressed || disabled) && styles.dimmed]}><Text style={styles.link}>{title}</Text></Pressable>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  form: { gap: 18 },
  intro: { gap: 10 },
  eyebrow: { color: c.textMuted, fontSize: 10, lineHeight: 16, fontWeight: '700', letterSpacing: 1.4 },
  email: { color: c.text, fontSize: 17, lineHeight: 25, fontWeight: '600' },
  hint: { color: c.textMuted, fontSize: 12, lineHeight: 18, marginTop: -10 },
  checkRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 1, borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: c.primary, borderColor: c.primary },
  flex: { flex: 1 },
  notice: { padding: 16, gap: 12, borderWidth: 1, borderColor: c.border, borderRadius: 14, backgroundColor: c.surface },
  alternatives: { gap: 2 },
  textAction: { minHeight: 48, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  link: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  dimmed: { opacity: 0.5 },
});
