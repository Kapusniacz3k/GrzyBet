import { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppColors } from '@/constants/app-theme';
import { MushroomIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable, MotionView } from '@/components/motion';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { searchSpecies, speciesLabel } from './mushroom-species';

export function SpeciesPicker({ value, onChange, disabled = false }: {
  value: string; onChange: (value: string) => void; disabled?: boolean;
}) {
  const colors = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const open = expanded && !disabled;
  const matches = searchSpecies(query);

  function choose(name: string) {
    if (disabled) return;
    onChange(name);
    setExpanded(false);
    setQuery('');
    Keyboard.dismiss();
  }

  return <View style={styles.field}>
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `Gatunek grzyba: ${speciesLabel(value)}` : 'Wybierz gatunek grzyba'}
      accessibilityHint="Rozwija listę gatunków z wyszukiwaniem" aria-expanded={open} disabled={disabled}
      onPress={() => { setExpanded(current => !current); setQuery(''); Keyboard.dismiss(); }}
      style={({ pressed }) => [styles.trigger, open && styles.triggerOpen, (pressed || disabled) && styles.dimmed]}>
      <MushroomIcon size={23} color={colors.accent} stemColor={colors.accent} />
      <Text style={[styles.selectedText, !value && styles.placeholder]}>{value ? speciesLabel(value) : 'Wybierz gatunek grzyba'}</Text>
      <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
    </Pressable>
    {open && <MotionView distance={0} style={styles.dropdown}>
      <View style={styles.searchRow}>
        <TextInput accessibilityLabel="Szukaj gatunku grzyba" placeholder="Szukaj nazwy, np. prawdziwek…"
          value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none"
          placeholderTextColor={colors.textMuted} style={styles.searchInput} />
        {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Wyczyść wyszukiwanie" onPress={() => setQuery('')} style={styles.clear}>
          <Text style={styles.clearText}>×</Text>
        </Pressable>}
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.resultCount}>Gatunki: {matches.length}</Text>
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.list}>
        {matches.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.label}
          accessibilityState={{ checked: item.name === value }} aria-checked={item.name === value}
          onPress={() => choose(item.name)} style={({ pressed }) => [styles.option, item.name === value && styles.optionSelected, pressed && styles.dimmed]}>
          <View style={styles.optionText}><Text style={styles.optionLabel}>{item.label}</Text><Text style={styles.latin}>{item.scientificName}</Text></View>
          {item.name === value && <Text style={styles.check}>✓</Text>}
        </Pressable>)}
        {!matches.length && <View style={styles.empty}><Text style={styles.optionLabel}>Nie znaleziono gatunku</Text>
          <Text style={styles.latin}>Spróbuj krótszej nazwy lub nazwy potocznej.</Text></View>}
      </ScrollView>
    </MotionView>}
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  field: { gap: 8 },
  trigger: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 12, backgroundColor: c.surface },
  triggerOpen: { borderColor: c.primary },
  selectedText: { flex: 1, minWidth: 0, color: c.text, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  placeholder: { color: c.textMuted, fontWeight: '400' },
  chevron: { color: c.accent, fontSize: 24, lineHeight: 26 },
  dropdown: { borderWidth: 1, borderColor: c.border, borderRadius: 14, overflow: 'hidden', backgroundColor: c.surface },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 10, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 10, backgroundColor: c.surfaceInset },
  searchInput: { flex: 1, minWidth: 0, minHeight: 48, padding: 12, color: c.text, fontSize: 14 },
  clear: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: c.textMuted, fontSize: 24 },
  resultCount: { paddingHorizontal: 14, paddingBottom: 10, color: c.textMuted, fontSize: 11, lineHeight: 17 },
  list: { maxHeight: 280 },
  option: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: c.border },
  optionSelected: { backgroundColor: c.accentSoft },
  optionText: { flex: 1, minWidth: 0, gap: 3 },
  optionLabel: { color: c.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  latin: { color: c.textMuted, fontSize: 11, lineHeight: 17 },
  check: { color: c.accent, fontSize: 19 },
  empty: { padding: 16, gap: 6 },
  dimmed: { opacity: 0.6 },
});
