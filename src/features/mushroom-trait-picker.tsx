import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { CheckIcon, CloseIcon, MushroomTraitIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable } from '@/components/motion';
import { Button } from './ui';
import { mushroomSpecies } from './mushroom-species';
import { emptyTraitSelection, identificationNotice, identificationSafetySource, matchesMushroomTraits, toggleTrait, traitQuestions, type TraitSelection } from './mushroom-traits';

export function MushroomTraitPicker({ initial, onApply, onClose }: {
  initial: TraitSelection; onApply: (selection: TraitSelection) => void; onClose: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const reducedMotion = useReducedMotion();
  const [selection, setSelection] = useState<TraitSelection>(() => ({ color: [...initial.color], underside: [...initial.underside], shape: [...initial.shape], habitat: [...initial.habitat] }));
  const [step, setStep] = useState(0);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const question = traitQuestions[step];
  const count = mushroomSpecies.filter(species => matchesMushroomTraits(species.id, selection)).length;
  const last = step === traitQuestions.length - 1;
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [step]);
  function skip() { setSelection(current => ({ ...current, [question.key]: [] })); setStep(current => current + 1); }
  return <Modal visible transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose} accessibilityLabel="Rozpoznaj po cechach">
    <SafeAreaView style={styles.overlay}>
      <View accessibilityViewIsModal onAccessibilityEscape={onClose} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Rozpoznaj po cechach</Text>
            <Text style={styles.muted}>Zawęź listę gatunków w Grzybedexie.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Zamknij wybór cech" onPress={onClose} style={styles.iconButton}>
            <CloseIcon size={18} color={colors.textMuted} />
          </Pressable>
        </View>
        <View style={styles.steps}>
          {traitQuestions.map((item, index) => <View key={item.key} style={styles.step}>
            <View style={[styles.stepLine, index <= step && styles.stepLineActive]} />
            <Text style={[styles.stepLabel, index === step && styles.stepLabelActive]}>{item.label}</Text>
          </View>)}
        </View>
        <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.muted}>KROK {step + 1} Z {traitQuestions.length}</Text>
          <Text accessibilityRole="header" style={styles.question}>{question.title}</Text>
          <Text style={styles.copy}>{question.hint}</Text>
          <View style={styles.options}>
            {question.options.map(option => {
              const checked = selection[question.key].includes(option.id);
              return <Pressable key={option.id} accessibilityRole="checkbox" accessibilityLabel={option.label}
                accessibilityState={{ checked }} aria-checked={checked}
                onPress={() => setSelection(current => toggleTrait(current, question.key, option.id))}
                style={({ pressed }) => [styles.option, question.key === 'color' && styles.colorOption, checked && styles.optionSelected, pressed && styles.pressed]}>
                {'swatch' in option ? <View style={[styles.swatch, { backgroundColor: option.swatch }]} />
                  : <View style={[styles.featureIcon, checked && styles.featureIconSelected]}>
                    <MushroomTraitIcon name={option.id} color={checked ? colors.navigationActive : colors.textSecondary} />
                  </View>}
                <View style={styles.optionCopy}><Text style={styles.optionLabel}>{option.label}</Text>
                  {'detail' in option && <Text style={styles.detail}>{option.detail}</Text>}</View>
                {(question.key !== 'color' || checked) && <View style={[styles.check, question.key === 'color' && styles.colorCheck, checked && styles.checkSelected]}>
                  {checked && <CheckIcon size={12} color={colors.onActionGreen} />}
                </View>}
              </Pressable>;
            })}
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.matches}>Pasuje w katalogu: {count} z {mushroomSpecies.length}</Text>
          {count === 0 && <Text style={styles.copy}>Brak dopasowań. Zmień lub pomiń cechę. Obserwowany grzyb może nie występować w naszym katalogu.</Text>}
          <View style={styles.notice}><Text style={styles.detail}>{identificationNotice}</Text>
            <Link href={identificationSafetySource} style={styles.link}>Zasady bezpiecznego rozpoznawania ↗</Link></View>
        </ScrollView>
        <View style={styles.footer}>
          <View style={styles.navigation}>
            <View style={styles.navButton}><Button title={step === 0 ? 'Anuluj' : 'Wstecz'} secondary onPress={() => { if (step === 0) onClose(); else setStep(current => current - 1); }} /></View>
            <View style={styles.navButton}><Button title={last ? `Pokaż wyniki (${count})` : 'Dalej'} onPress={() => { if (last) onApply(selection); else setStep(current => current + 1); }} /></View>
          </View>
          <View style={styles.footerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Wyczyść wszystkie cechy" onPress={() => { setSelection(emptyTraitSelection()); setStep(0); }} style={styles.textButton}>
              <Text style={styles.muted}>Wyczyść wybór</Text>
            </Pressable>
            {!last && <Pressable accessibilityRole="button" onPress={skip} style={styles.textButton}><Text style={styles.muted}>Nie wiem · pomiń</Text></Pressable>}
            {last && <Pressable accessibilityRole="button" onPress={() => onApply({ ...selection, [question.key]: [] })} style={styles.textButton}><Text style={styles.muted}>Pomiń i pokaż wyniki</Text></Pressable>}
          </View>
        </View>
      </View>
    </SafeAreaView>
  </Modal>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  overlay: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: c.overlay },
  card: { width: '100%', maxWidth: 480, height: '94%', maxHeight: 780, borderRadius: 22, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 20, paddingRight: 10, paddingVertical: 14 },
  heading: { flex: 1, minWidth: 0, gap: 6 },
  title: { color: c.text, fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4 },
  muted: { color: c.textMuted, fontSize: 11, lineHeight: 17 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  steps: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 14 },
  step: { flex: 1, gap: 6 },
  stepLine: { height: 3, borderRadius: 2, backgroundColor: c.border },
  stepLineActive: { backgroundColor: c.actionGreen },
  stepLabel: { color: c.textMuted, fontSize: 11 },
  stepLabelActive: { color: c.text, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 8, gap: 14 },
  question: { color: c.text, fontSize: 23, lineHeight: 29, fontWeight: '600', letterSpacing: -0.5 },
  copy: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { width: '100%', minHeight: 64, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 12 },
  colorOption: { flexGrow: 1, flexBasis: '45%', width: undefined, minHeight: 64, paddingHorizontal: 10, gap: 8 },
  optionSelected: { backgroundColor: c.navigationSurface, borderColor: c.navigationActive },
  optionCopy: { flex: 1, minWidth: 0, gap: 4 },
  optionLabel: { color: c.text, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  detail: { color: c.textMuted, fontSize: 11, lineHeight: 18 },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: c.borderStrong },
  featureIcon: { width: 36, height: 36, flexShrink: 0, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceRaised },
  featureIconSelected: { backgroundColor: c.navigationSurface },
  check: { width: 18, height: 18, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  colorCheck: { position: 'absolute', top: 5, right: 5, width: 14, height: 14, borderRadius: 4 },
  checkSelected: { backgroundColor: c.actionGreen, borderColor: c.actionGreen },
  matches: { color: c.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  notice: { gap: 6, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.border },
  link: { color: c.textSecondary, fontSize: 11, lineHeight: 18, paddingVertical: 6 },
  footer: { gap: 2, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, borderTopWidth: 1, borderTopColor: c.border },
  navigation: { flexDirection: 'row', gap: 10 },
  navButton: { flex: 1 },
  footerActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, flexShrink: 1 },
  pressed: { opacity: 0.65 },
});
