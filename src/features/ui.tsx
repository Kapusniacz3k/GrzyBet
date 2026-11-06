import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle, type TextInputProps } from 'react-native';
import { MotionPressable as Pressable, MotionView } from '@/components/motion';
import { usePreferences } from './preferences';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHasBottomNavigation } from '@/components/app-navigation';
import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
export function Page({ children, contentStyle }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const s = useUIStyles();
  const hasBottomNavigation = useHasBottomNavigation();
  return <SafeAreaView style={s.fill} edges={hasBottomNavigation ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
    <MotionView style={s.fill}>
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.page, contentStyle]}>{children}</ScrollView>
    </KeyboardAvoidingView>
    </MotionView>
  </SafeAreaView>;
}
export function Hint({ children }: { children: ReactNode }) { const { showHints } = usePreferences(); return showHints ? <Copy>{children}</Copy> : null; }
export function Title({ children }: { children: ReactNode }) { const s = useUIStyles(); return <Text style={s.title}>{children}</Text>; }
export function Label({ children }: { children: ReactNode }) { const s = useUIStyles(); return <Text style={s.label}>{children}</Text>; }
export function Copy({ children }: { children: ReactNode }) { const s = useUIStyles(); return <Text style={s.copy}>{children}</Text>; }
export function Card({ children }: { children: ReactNode }) { const s = useUIStyles(); return <View style={s.card}>{children}</View>; }
export function Button({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) { const s = useUIStyles(); return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, (pressed || disabled) && { opacity: 0.5 }]}><Text style={[s.buttonText, secondary && s.secondaryText]}>{title}</Text></Pressable>; }
export function Field({ label, ...props }: TextInputProps & { label: string }) { const s = useUIStyles(); const colors = useAppTheme(); return <View style={{ gap: 8 }}><Copy>{label}</Copy><TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.textMuted} style={[s.input, props.style]} /></View>; }
export function Message({ text }: { text: string }) { const s = useUIStyles(); return text ? <Text accessibilityLiveRegion="polite" style={s.message}>{text}</Text> : null; }
export function Choices({ options, value, onChange, disabled, getLabel }: { options: string[]; value: string; onChange: (value: string) => void; disabled?: boolean; getLabel?: (value: string) => string }) { const s = useUIStyles(); return <View style={s.choices}>{options.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: option === value, disabled }} aria-checked={option === value} aria-disabled={disabled} disabled={disabled} onPress={() => onChange(option)} style={[s.choice, value === option && s.selected]}><Text style={[s.choiceText, value === option && s.buttonText]}>{getLabel ? getLabel(option) : option}</Text></Pressable>)}</View>; }
export function useUIStyles() { return useThemedStyles(createStyles); }
const createStyles = (c: AppColors) => StyleSheet.create({
  fill: { flex: 1, backgroundColor: c.background },
  page: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 22, paddingBottom: 40, gap: 20 },
  title: { color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  label: { color: c.text, fontSize: 19, fontWeight: '700' },
  copy: { color: c.textSecondary, fontSize: 14, lineHeight: 22 },
  card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 18, gap: 14 },
  button: { minHeight: 48, padding: 14, backgroundColor: c.primary, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderStrong },
  buttonText: { color: c.onPrimary, fontSize: 14, fontWeight: '700' },
  secondaryText: { color: c.text },
  choiceText: { color: c.text, fontSize: 14, fontWeight: '700' },
  input: { backgroundColor: c.surface, borderColor: c.borderStrong, borderWidth: 1, borderRadius: 6, minHeight: 50, padding: 14, color: c.text, fontSize: 16 },
  message: { color: c.text, borderLeftWidth: 3, borderLeftColor: c.primary, padding: 12, lineHeight: 22 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: c.borderStrong, borderRadius: 6, paddingHorizontal: 16, minHeight: 46, justifyContent: 'center' },
  selected: { backgroundColor: c.primary, borderColor: c.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  badge: { color: c.onPrimary, backgroundColor: c.primary, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '700', borderRadius: 4 },
});
