import type { AppColors } from '@/constants/app-theme';
import { useThemedStyles } from '@/hooks/use-app-theme';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { MotionPressable as Pressable, MotionView, motionLayout } from '@/components/motion';
import { SafeAreaView } from 'react-native-safe-area-context';

const chapters = [
  {
    title: 'Zbierz ekipę',
    paragraphs: [
      'Stwórz pokój, ustaw datę i limit uczestników, a potem przekaż znajomym kod. Masz już kod? Wybierz „Dołącz do pokoju”.',
      'Wszyscy spotykacie się w lobby i czekacie, aż organizator uruchomi pytania. Po ich rozpoczęciu nie można już dołączyć.',
    ],
  },
  {
    title: 'Odpowiedz na pytania',
    paragraphs: [
      'Pytania pojawiają się pojedynczo. Typujesz, kto zbierze najwięcej grzybów, ile zbierzesz Ty, ile zbierze cała ekipa i jaki gatunek będzie najczęstszy.',
      'Każdy odpowiada we własnym tempie. Na końcu sprawdź podsumowanie i zatwierdź typy — od tej chwili nie można ich zmienić.',
    ],
  },
  {
    title: 'Poczekaj na start poszukiwań',
    paragraphs: [
      'Gdy wszyscy zatwierdzą odpowiedzi, organizator wybiera „Wystartuj poszukiwania”. Sama data wyprawy nie uruchamia gry.',
      'Dopiero wtedy pojawiają się Zbiory. Wyniki pozostają ukryte do zakończenia grzybobrania.',
    ],
  },
  {
    title: 'Dodawaj swoje zbiory',
    paragraphs: [
      'W zakładce Zbiory wybierz gatunek, podaj liczbę sztuk i dodaj zdjęcie z aparatu lub galerii. Możesz też dopisać notatkę.',
      'Organizator sprawdza każde zgłoszenie i zatwierdza je albo odrzuca z podaniem powodu. Do wyniku liczą się tylko zatwierdzone zbiory.',
    ],
  },
  {
    title: 'Zobacz wyniki wyprawy',
    paragraphs: [
      'Po rozpatrzeniu wszystkich zgłoszeń organizator kończy wyprawę. Wtedy u wszystkich otwiera się zakładka Wyniki.',
      'Porównacie liczbę zebranych grzybów i punkty za typowanie. Remisy oznaczają wspólne miejsce. Po zakończeniu nie można już dodawać zbiorów ani zmieniać decyzji.',
    ],
  },
  {
    title: 'Jak liczymy punkty?',
    paragraphs: [
      '• Zwycięzca zbiorów: 100 pkt.\n• Własny zbiór: dokładny typ — 100 pkt, pomyłka do 3 sztuk — 70 pkt, do 5 sztuk — 40 pkt.\n• Dokładny zbiór całej ekipy: 100 pkt.\n• Najczęstszy gatunek: 50 pkt.',
      'Łącznie możesz zdobyć 350 pkt. Przy remisie zaliczamy każdego zwycięzcę i każdy najczęstszy gatunek. Jeśli nikt nic nie zbierze, nie przyznajemy punktów za zwycięzcę ani gatunek.',
    ],
  },
];

export function HowToPlayModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const styles = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState<number[]>([0]);
  const reducedMotion = useReducedMotion();
  function toggle(index: number) {
    setExpanded(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index]);
  }

  return <Modal visible={visible} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose} accessibilityLabel="Jak to działa?">
    <SafeAreaView style={styles.overlay}>
      <Pressable accessible={false} importantForAccessibility="no" onPress={onClose} style={StyleSheet.absoluteFill} />
      <MotionView accessibilityViewIsModal onAccessibilityEscape={onClose} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>Jak to działa?</Text>
            <Text style={styles.subtitle}>Od pierwszego kodu do ostatniego grzyba.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Zamknij instrukcję" onPress={onClose}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.chapters} showsVerticalScrollIndicator={false}>
          {chapters.map((chapter, index) => {
            const open = expanded.includes(index);
            return <Animated.View key={chapter.title} layout={motionLayout} style={[styles.chapter, open && styles.chapterOpen]}>
              <Pressable accessibilityRole="button" accessibilityLabel={chapter.title} aria-expanded={open}
                accessibilityHint={open ? 'Zwiń rozdział' : 'Rozwiń rozdział'} onPress={() => toggle(index)}
                style={({ pressed }) => [styles.chapterHeading, pressed && styles.pressed]}>
                <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.expandIcon}>{open ? '−' : '+'}</Text>
              </Pressable>
              {open && <Animated.View entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
                exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)} style={styles.chapterContent}>
                {chapter.paragraphs.map(paragraph => <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>)}
              </Animated.View>}
            </Animated.View>;
          })}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.done, pressed && styles.pressed]}>
            <Text style={styles.doneText}>Rozumiem</Text>
          </Pressable>
        </View>
      </MotionView>
    </SafeAreaView>
  </Modal>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  overlay: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: c.overlay },
  card: { width: '100%', maxWidth: 480, maxHeight: '90%', flexShrink: 1, backgroundColor: c.surface, borderRadius: 24,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20 },
  heading: { flex: 1, gap: 8 },
  title: { color: c.text, fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: c.textMuted, fontSize: 13, lineHeight: 19 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { color: c.text, fontSize: 28, lineHeight: 32 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  chapters: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  chapter: { borderWidth: 1, borderColor: c.border, borderRadius: 14, overflow: 'hidden' },
  chapterOpen: { borderColor: c.accentBorder, backgroundColor: c.accentSoft },
  chapterHeading: { minHeight: 62, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  number: { color: c.accent, fontSize: 12, fontWeight: '700' },
  chapterTitle: { flex: 1, color: c.text, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  expandIcon: { color: c.textMuted, fontSize: 22, lineHeight: 26 },
  chapterContent: { paddingHorizontal: 14, paddingBottom: 18, gap: 12 },
  paragraph: { color: c.textSecondary, fontSize: 14, lineHeight: 22 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: c.border },
  done: { minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: c.onPrimary, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
