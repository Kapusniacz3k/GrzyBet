# Identyfikacja GrzyBet

Ikony konturowe roślinki, książki, profilu, informacji, uczestników i kodu pokoju korzystają z geometrii Lucide. Renderuje je istniejący `react-native-svg`, bez dodatkowej biblioteki ikon. Informacje o autorach i pełne licencje ISC oraz Feather MIT są w `LUCIDE-LICENSE.txt`.

- `grzybet-wordmark.svg`: jednokolorowy napis GrzyBet w ciepłej bieli (`#E8E4DC`), w stylu nagłówka strony głównej. Litery są krzywymi, więc plik nie wymaga zainstalowanej czcionki.
- `splash-mark.svg` i `splash-mark-light.svg`: grzyb bez okręgów, według geometrii komponentu `MushroomIcon`, w wariancie ciemnym i jasnym.

Pliki PNG używane przez Expo znajdują się w `assets/images`:

- `icon.png`: pełna, nieprzezroczysta ikona 1024 × 1024 na grafitowym tle `#171614`. Bez zaokrąglania narożników; maskę nakłada system.
- `android-icon-foreground.png`: napis na przezroczystym tle 1024 × 1024, pomniejszony do bezpiecznej strefy ikony adaptacyjnej.
- `android-icon-monochrome.png`: ta sama warstwa w jednym kolorze dla ikon tematycznych Androida.
- `splash-icon.png`, `splash-icon-light.png`: przezroczyste grzyby 1024 × 1024, wyświetlane w szerokości 112 punktów, zgodnie z ekranem łączenia.
- `favicon.png`: ikona karty przeglądarki 96 × 96.

Konfigurację zawiera `app.json`. Systemowy ekran startowy pokazuje grzyba i tło zależne od motywu telefonu: grafit `#171614` lub ciepłą biel `#F4F1EB`. Kapelusz odpowiada `navigationActive`, tak jak „Bet” w logo: `#96CDA6` w ciemnym i `#22683B` w jasnym motywie. Kolory trzonu i plamek to `mushroomStem` i `mushroomSpots` z `src/constants/app-theme.ts`. Po uruchomieniu interfejsu ekran `ConnectionScreen` dodaje napis GrzyBet i „Łączenie z aplikacją…” oraz korzysta z motywu zapisanego w aplikacji. Czasu oczekiwania nie wydłużamy sztucznie.

Ikona telefonu oraz systemowy ekran startowy wymagają nowego builda aplikacji. Expo Go pokazuje własny ekran uruchamiania; pełny wygląd należy sprawdzać w buildzie preview lub produkcyjnym.
