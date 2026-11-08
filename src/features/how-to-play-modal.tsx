import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { MotionPressable as Pressable, MotionView, motionLayout } from '@/components/motion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloseIcon, PlusIcon } from '@/components/grzybet-icons';
import { boostScoringCopy, numericScoringCopy, numericToleranceCopy } from './prediction-copy';

const chapters = [
  {
    title: 'Zbierz ekipę',
    paragraphs: [
      'Stwórz pokój, wybierz nazwę, limit uczestników i tryb: Typowanie albo Kupony. Przekaż znajomym kod.',
      'Wszyscy spotykacie się w lobby i czekacie, aż organizator rozpocznie typowanie lub otworzy zakłady. Po starcie nie można już dołączyć.',
    ],
  },
  {
    title: 'Tryb Kupony',
    paragraphs: [
      'Każdy zaczyna każdą wyprawę z nowymi 10 grzybkami. To punkty w grze. Na wspólnej stronie zakładów wybierasz zwycięzcę, własny zbiór, wynik ekipy lub najczęstszy gatunek.',
      'Na jednym kuponie możesz połączyć od 1 do 4 typów, po jednym z każdej kategorii. Kursy mnożą się, a wszystkie typy muszą trafić. Podaj pełną stawkę od 1 grzybka. Możesz postawić kilka kuponów w granicach salda.',
      'Kursy są stałe w tej wyprawie. Wygrana zawiera stawkę. Remis zalicza każdego zwycięzcę i każdy najczęstszy gatunek; przy pustym koszyku nie ma zwycięzcy ani najczęstszego gatunku.',
      'Gdy skończysz, oznacz gotowość. Możesz zakończyć także bez kuponu. Gospodarz rusza na zbiory dopiero po gotowości całej ekipy. Wyniki i kupony innych graczy odsłaniamy po zakończeniu wyprawy. Wygrywa najwyższy stan końcowy: niewydane grzybki plus wygrane kuponów.',
    ],
  },
  {
    title: 'Odpowiedz na pytania',
    paragraphs: [
      'Pytania pojawiają się pojedynczo. Typujesz, kto zbierze najwięcej grzybów, ile zbierzesz Ty, ile zbierze cała ekipa i jaki gatunek będzie najczęstszy.',
      'Każdy odpowiada we własnym tempie. Na końcu sprawdź podsumowanie i zatwierdź typy — od tej chwili nie można ich zmienić.',
      'Przed zatwierdzeniem możesz wybrać jednego pewniaka ×2. Po zatwierdzeniu jego wybór też jest zablokowany.',
    ],
  },
  {
    title: 'Poczekaj na start poszukiwań',
    paragraphs: [
      'Gdy wszyscy zatwierdzą odpowiedzi lub zakończą stawianie kuponów, organizator wybiera „Wystartuj poszukiwania”. Każdy etap rozpoczyna organizator.',
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
      'Porównacie liczbę zebranych grzybów oraz punkty za typowanie lub stan grzybków w trybie Kupony. Remisy oznaczają wspólne miejsce. Po zakończeniu nie można już dodawać zbiorów ani zmieniać decyzji.',
    ],
  },
  {
    title: 'Jak liczymy punkty?',
    paragraphs: [
      `Punkty za typowanie własnych zbiorów i wyniku ekipy w nowych wyprawach: ${numericScoringCopy}`,
      numericToleranceCopy,
      boostScoringCopy,
      'Zwycięzca zbiorów: 100 pkt. Najczęstszy gatunek: 50 pkt. Z pewniakiem możesz zdobyć do 450 pkt. Przy remisie zaliczamy każdego zwycięzcę i każdy najczęstszy gatunek. Przy zerowych zbiorach punktują tylko typy liczbowe. Zasady starszych wypraw znajdziesz w ich wynikach.',
    ],
  },
];

export function HowToPlayModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
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
            <CloseIcon size={26} color={colors.text} />
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
                <PlusIcon size={22} expanded={open} color={colors.textMuted} />
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
  scroll: { flexGrow: 0, flexShrink: 1 },
  chapters: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  chapter: { borderWidth: 1, borderColor: c.border, borderRadius: 14, overflow: 'hidden' },
  chapterOpen: { borderColor: c.accentBorder, backgroundColor: c.accentSoft },
  chapterHeading: { minHeight: 62, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  number: { color: c.accent, fontSize: 12, fontWeight: '700' },
  chapterTitle: { flex: 1, color: c.text, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  chapterContent: { paddingHorizontal: 14, paddingBottom: 18, gap: 12 },
  paragraph: { color: c.textSecondary, fontSize: 14, lineHeight: 22 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: c.border },
  done: { minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: c.onPrimary, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
