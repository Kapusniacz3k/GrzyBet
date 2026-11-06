import { useState } from 'react';
import { router } from 'expo-router';
import { Switch, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useGame } from './game';
import { useAccount } from './account-context';
import { usePreferences } from './preferences';
import { Button, Card, Choices, Copy, Field, Label, Message, Page, useUIStyles, Title } from './ui';

export function SettingsScreen() {
  const s = useUIStyles();
  const colors = useAppTheme();
  const { displayName, mode } = useGame();
  const account = useAccount();
  const { showHints, themeMode, ready, saving, error, setShowHints, setThemeMode, retry } = usePreferences();
  return <Page>
    <Title>Po Twojemu</Title>
    <Copy>Ustawienia zapisują się na tym urządzeniu.</Copy>
    <Card>
      <Label>Wygląd aplikacji</Label>
      <Copy>Wybierz motyw, w którym najlepiej Ci się korzysta z GrzyBet.</Copy>
      <Choices options={['Jasny', 'Ciemny']} value={themeMode === 'light' ? 'Jasny' : 'Ciemny'} disabled={!ready || saving}
        onChange={value => { void setThemeMode(value === 'Jasny' ? 'light' : 'dark'); }} />
    </Card>
    <Card>
      <View style={s.row}>
        <View style={{ flex: 1, gap: 6 }}><Label>Podpowiedzi w grze</Label><Copy>Pokazuj dodatkowe wskazówki podczas odpowiadania na pytania.</Copy></View>
        <Switch accessibilityLabel="Podpowiedzi w grze" value={showHints} disabled={!ready || saving}
          onValueChange={value => { void setShowHints(value); }} trackColor={{ false: colors.borderStrong, true: colors.primary }} thumbColor={colors.onPrimary} />
      </View>
      {saving && <Copy>Zapisywanie…</Copy>}
      {!ready && !error && <Copy>Wczytywanie ustawień…</Copy>}
      <Message text={error} />
      {!ready && !!error && <Button title="Ponów odczyt ustawień" secondary onPress={retry} />}
    </Card>
    {account && <Card><Label>Konto</Label><Copy>{account.isGuest ? 'Grasz jako gość. Zabezpiecz konto, żeby zachować dostęp po zmianie telefonu.' : account.email}</Copy>
      <Button title={account.isGuest ? 'Zabezpiecz konto lub zaloguj się' : 'Zarządzaj kontem'} secondary disabled={account.busy} onPress={() => router.push('/account')} /></Card>}
    {mode === 'online' && <NicknameSettings />}
    <Card><Label>Twój profil</Label><Copy>Grasz jako {displayName}.</Copy><Button title="Zobacz profil" secondary onPress={() => router.push('/profile')} /></Card>
    <Card><Label>O GrzyBet</Label><Copy>Wspólne grzybobranie i typowanie dla znajomych. Gra toczy się o punkty.</Copy><Copy>{mode === 'online' ? 'Gra online: lobby, odpowiedzi i wyniki są synchronizowane między telefonami. Możesz grać jako gość lub korzystać z konta z e-mailem i hasłem.' : 'Wersja lokalna: pokoje i zdjęcia są zapisane na tym urządzeniu. Gra online wymaga podłączenia projektu.'}</Copy></Card>
  </Page>;
}

function NicknameSettings() {
  const { displayName, setDisplayName, busy } = useGame();
  const [name, setName] = useState(displayName);
  const [message, setMessage] = useState('');
  async function save() {
    try { await setDisplayName?.(name); setMessage('Nick zapisany. W trwających pokojach pozostaje nazwa z momentu dołączenia.'); }
    catch (e) { setMessage((e as Error).message); }
  }
  return <Card><Label>Twój nick</Label><Field label="Nick" value={name} onChangeText={setName} maxLength={24} editable={!busy} />
    <Copy>Nowy nick obowiązuje przy tworzeniu i dołączaniu do kolejnych pokojów.</Copy><Message text={message} />
    <Button title="Zapisz nick" secondary disabled={busy} onPress={() => { void save(); }} />
  </Card>;
}
