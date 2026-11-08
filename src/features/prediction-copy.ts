import type { QuestionKey } from './domain';

export const predictionLabels: Record<QuestionKey, string> = {
  winner: 'Zwycięzca zbiorów', own: 'Twój zbiór', total: 'Wynik ekipy', species: 'Najczęstszy gatunek',
};
export const numericScoringCopy = 'Dokładnie: 100 pkt. Pomyłka o 1: 80 pkt, o 2: 60 pkt, o 3: 40 pkt, o 4: 30 pkt, o 5: 20 pkt.';
export const numericToleranceCopy = 'Twój zbiór: pomyłka powyżej 5 sztuk daje 0 pkt. Wynik ekipy: różnica 6–10 sztuk daje jeszcze 10 pkt, większa: 0 pkt.';
export const boostScoringCopy = 'Jeden pewniak ×2 podwaja punkty za wybraną odpowiedź, także za częściowe trafienie. Nietrafiony pewniak daje 0 pkt.';
