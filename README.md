# GrzyBet

Mobilna aplikacja Expo SDK 58 / React Native / TypeScript do typowania wyników grzybobrania i rozliczania wypraw.

## Uruchomienie na Windows

Zalecany Node.js 24 LTS, zgodnie z wersją używaną do budowania APK. Testy uruchamiają pliki TypeScript bez dodatkowego kompilatora.

- Zainstaluj zależności: npm install
- Uruchom: npx.cmd expo start --go --clear
- Połącz komputer i telefon z tą samą siecią Wi-Fi i zeskanuj kod QR w Expo Go.
- Jeżeli połączenie lokalne nie działa: npx.cmd expo start --go --clear --tunnel ngrok
- Wersja przeglądarkowa: npx.cmd expo start --web

ImagePicker, ImageManipulator, FileSystem, AsyncStorage i react-native-svg są dostępne w zgodnej wersji Expo Go.
Własna instalowalna aplikacja wymaga development build / EAS Build; polskie opisy uprawnień i konfiguracja aparatu są w app.json.

## Instalowana wersja Android — APK

Profil `preview` w `eas.json` tworzy podpisany plik APK do bezpośredniej instalacji, bez Expo Go i bez uruchamiania komputera. Identyfikator Androida: `pl.grzybet.app`. Numer builda jest zarządzany przez Expo i rośnie automatycznie. Profil zawiera publiczną konfigurację klienta Firebase `grzybet`, tak aby wspólna gra działała także bez lokalnego `.env.local`.

Projekt jest już połączony z kontem Expo `quberq` i identyfikatorem zapisanym w `app.json`. Do budowania aktualizacji użyj tego konta albo konta z dostępem do istniejącego projektu. Nie trzeba ponownie uruchamiać `eas init` ani zmieniać właściciela projektu.

1. Zaloguj się na konto mające dostęp do projektu: `npx.cmd --yes eas-cli@latest login`.
2. Sprawdź zalogowane konto: `npx.cmd --yes eas-cli@latest whoami`.
3. Uruchom budowanie: `npx.cmd --yes eas-cli@latest build --platform android --profile preview`.
4. Otwórz otrzymany link na Androidzie, pobierz APK i zainstaluj. Tę samą wersję możesz zainstalować na drugim telefonie.

Przy kolejnych buildach zachowaj istniejący projekt i klucz podpisujący, aby aktualizować aplikację z zachowaniem jej danych. Osoba bez uprawnień do konta `quberq` może uruchomić źródła lokalnie w Expo Go albo zainstalować przekazany APK; nie musi przejmować projektu Expo. Osobne wydanie na innym koncie wymaga świadomego utworzenia własnego projektu i ustalenia konfiguracji Firebase oraz podpisywania. Instalowana aplikacja ma osobną pamięć niż Expo Go, więc za pierwszym razem poprosi o nick i utworzy własne konto gościa.

`.easignore` wyłącza z paczki m.in. lokalne pliki środowiskowe, pamięć podręczną, testy i klucze podpisujące. Publiczne parametry Firebase w `eas.json` nie są danymi administratora; dostęp do danych nadal ograniczają reguły Firestore i Storage.

## Co działa

- Jasny i ciemny motyw wybierane w Ustawienia → Wygląd aplikacji. Wybór zapisuje się na urządzeniu razem z podpowiedziami i obejmuje ekrany, formularze, nawigację, instrukcję oraz łączenie z aplikacją.
- Interfejs używa grafitu, ciepłej bieli i piaskowego akcentu. Zieleń wyróżnia aktywną zakładkę dolnej nawigacji, „Bet” w logo interfejsu i główny przycisk ekranu startowego. Pozostałe przyciski, zaznaczenia i tła są neutralne; rangi zachowują swoje kolory w szczegółach grzyba. Przyciski, pola i karty mają wspólne zaokrąglenia i spokojniejszą typografię.
- Jeśli na Pixelu jasny motyw w Expo Go pozostaje ciemny, sprawdź systemowy rozszerzony ciemny motyw. Wyłącz go dla Expo Go lub wybierz Standardowy; rozszerzona opcja przetwarza kolory niezależnie od palety aplikacji. [Instrukcja Google](https://support.google.com/accessibility/android/answer/6151800?hl=pl).
- Krótkie animacje wejścia ekranów i kafelków, sprężysta reakcja przycisków, płynne przejścia, rozwijanie instrukcji i historii oraz subtelny ruch grzyba podczas łączenia. Animacje respektują systemowe ograniczenie ruchu.
- Ikony w interfejsie są rysowane przez `react-native-svg`: grzyb, Grzybedex, profil, kłódka, ustawienia, pomoc, historia, odznaki i symbole przycisków. Wspólny zestaw jest w `src/components/grzybet-icons.tsx`; rozmiary i kolory dopasowują się do miejsca użycia oraz motywu. Dekoracyjne ikony nie przechwytują dotyku ani nie powielają etykiet przycisków w czytniku ekranu. Istniejący APK wymaga ponownego zbudowania, aby zawierał nową bibliotekę; w Expo Go wystarczy odświeżyć projekt.
- Prosty ekran łączenia i wczytywania: logo GrzyBet, grzyb bez otaczających okręgów oraz „Łączenie z aplikacją…” ze wskaźnikiem ładowania. Przy błędzie można ponowić próbę.
- Ikona aplikacji to napis GrzyBet w ciepłej bieli na grafitowym tle. Przygotowane są też warstwy adaptacyjna i monochromatyczna Androida, ikona iOS i favicon. Systemowy ekran startowy ma ten sam grzyb bez okręgów, z jasnym i ciemnym tłem. Ikona i systemowy ekran startowy wymagają nowego builda preview/produkcyjnego; Expo Go nie odwzorowuje ich w pełni. Źródła wektorowe i opis plików: assets/branding/README.md.
- Ekran startowy wita gracza po nicku („Witaj, …”) i pokazuje najnowszą własną aktywną wyprawę, skróty Stwórz pokój / Dołącz kodem, ostatnią zakończoną wyprawę i pasek kolekcji. Ostatni wynik rozróżnia punkty klasycznego typowania i saldo kuponów. Brak wypraw pokazuje prawdziwy pusty stan; postęp kolekcji liczy tylko własne zatwierdzone znaleziska.
- Przycisk „Jak to działa?” otwiera instrukcję w oknie z rozwijanymi rozdziałami i zasadami punktacji.
- Wspólny dolny pasek zawiera Start z roślinką, Grzybedex z konturową książką i Profil z konturem postaci. Aktywna pozycja ma delikatne zielone podświetlenie. Pasek jest widoczny także w profilu, kartach grzybów i pokojach, a w ustawieniach znika.
- Grzybedex ma 50 gatunków, m.in. borowiki, podgrzybki, maślaki, koźlarze, rydze, boczniaki, pieczarki, gołąbki, kanię, siedziunia i uszaka. Każdy ma osobny kafelek, zdjęcie, notatkę i postęp rang. Karta pokazuje zdjęcie, łączny własny zbiór, rekord jednej wyprawy i liczbę wypraw ze znaleziskiem. Statystyki obejmują tylko własne zatwierdzone sztuki z rozpoczętych poszukiwań i zakończonych wypraw. Ta sama lista działa w typowaniu, kuponach i zgłoszeniach zbiorów; wyszukiwanie obsługuje nazwy potoczne i łacińskie, także bez polskich znaków.
- Gatunek w typowaniu i zgłoszeniu zbioru wybiera się z rozwijanej listy z wyszukiwaniem. Wyszukiwanie uwzględnia nazwy potoczne, naukowe i zapis bez polskich znaków. Dotychczasowe klucze Borowik, Podgrzybek, Maślak i Kurka pozostają zgodne ze starszymi zapisami.
- Nieodkryte gatunki mają szarą kłódkę zamiast zdjęcia. Pierwsza zatwierdzona sztuka odblokowuje zdjęcie i krótką notatkę z podanym źródłem. Karta pokazuje obecną rangę i liczbę sztuk do kolejnej, bez listy wszystkich rang.
- Nagłówek Grzybedexu i podsumowanie gatunków, sztuk oraz odznak są przypięte u góry; przewija się tylko lista kafelków. Mniejszy nagłówek, podsumowanie i kafelki pozwalają pokazać dwa pełne rzędy grzybów na ekranie telefonu.
- Grzybedex ma filtry Wszystkie, Odkryte i Nieodkryte. Kafelki pokazują liczbę sztuk, obecną rangę i pasek postępu do następnej; nieodkryte gatunki nadal mają szarą kłódkę. Filtry nie zmieniają całkowitych statystyk kolekcji.
- Odznaki zdobywa się osobno dla każdego gatunku: Drewno 1, Brąz 10, Srebro 50, Złoto 100, Diament 250, Grzybiarz 1000 sztuk. Postęp jest wyliczany z aktualnych zgłoszeń, bez osobnego zapisu liczników. Zdjęcia są dołączone do aplikacji; autorzy i poszczególne licencje są w assets/images/grzybdex/CREDITS.md oraz w odblokowanej karcie gatunku.
- Ustawienia są dostępne pod ikoną w prawym górnym rogu.
- Profil ma prosty nagłówek z inicjałem i nickiem, wspólną neutralną kartę statystyk, domyślnie zwiniętą historię i lekką listę aktywnych kuponów. Kolory ograniczono do tła, tekstu, subtelnych linii i zielonego akcentu. Ustawienia są pod ikoną w nagłówku.
- Konto online jest opcjonalne: można zabezpieczyć obecnego gościa e-mailem i hasłem, zachowując nick, wyprawy i Grzybedex, albo zalogować się na istniejące konto. Formularze są w profilu i ustawieniach, a logowanie także przed wyborem nicku. Dostępne są powtórzenie i podgląd hasła, reset hasła oraz wylogowanie. Przełączenie gościa z wyprawami na inne konto wymaga potwierdzenia; konta nie są automatycznie łączone. W Firebase trzeba włączyć Anonymous oraz Email/Password. Testy emulatora obejmują zachowanie postępu po logowaniu na drugim urządzeniu, konflikt e-maila, błędne dane i pełny reset hasła.
- Usunięcie konta jest dostępne bezpośrednio w profilu, pod przyciskami zabezpieczenia konta i logowania; dla zalogowanego konta także w zarządzaniu kontem. Okno wymaga pełnych 5 sekund od otwarcia oraz zaznaczenia potwierdzenia; ponowne otwarcie zeruje oba warunki. Przy starszej sesji można potwierdzić hasło bez wychodzenia z okna. Usuwamy konto Firebase Authentication i dostęp do jego postępu; wspólne wyprawy, wyniki oraz zdjęcia pozostają u uczestników, o czym okno informuje. Po usunięciu można rozpocząć nowy profil gościa. Testy obejmują blokadę czasu i potwierdzenia, niepoprawne hasło, usunięcie konta oraz zachowanie wspólnej wyprawy innego uczestnika.
- Jeden przycisk Wznów grę pozwala wrócić do ostatniej aktywnej wyprawy.
- Ustawienie podpowiedzi w pytaniach zapisuje się lokalnie.
- Tworzenie pokoju wymaga tylko nazwy i limitu uczestników; dołącza się kodem. Data wyprawy pochodzi z momentu utworzenia pokoju. Rzeczywisty start typowania zapisuje się raz, po kliknięciu przez organizatora „Rozpocznij typowanie”. W online oba momenty pochodzą z zegara serwera i są takie same dla uczestników. Godzina pozostaje niezmienna przy starcie poszukiwań i zakończeniu wyprawy. Starsze pokoje online korzystają z zapisanej daty utworzenia; brakującej godziny typowania nie odtwarzamy z dawnej planowanej daty.
- Lobby, pytania po jednym i jeden zatwierdzony kupon na uczestnika.
- Etapy: lobby → pytania → oczekiwanie na gotowość wszystkich → poszukiwania → zakończona wyprawa.
- Organizator najpierw uruchamia pytania przyciskiem „Rozpocznij typowanie”. Dołączanie jest dostępne tylko w lobby. Etapy rozpoczyna organizator.
- Każdy odpowiada kolejno na cztery pytania, we własnym tempie. Postęp zapisuje się po każdej odpowiedzi i wraca po ponownym uruchomieniu.
- Po czwartym pytaniu uczestnik zatwierdza podsumowanie. Wcześniej może rozpocząć odpowiadanie od nowa; po zatwierdzeniu typów nie można edytować.
- W lobby widać gotowość oraz postęp każdego uczestnika. Dopiero gdy wszyscy zatwierdzą odpowiedzi, organizator może nacisnąć Wystartuj poszukiwania.
- Po wystartowaniu poszukiwań dostępne są tylko Zbiory. Po zakończeniu grzybobrania przez organizatora zostają dwie zakładki: Zbiory i Wyniki; domyślnie otwierają się Wyniki. W samych Wynikach nie ma dodatkowego przełącznika Typowanie/Zbiory ani Saldo/Zebrane sztuki. Podsumowanie liczbowe, lista uczestników i rozwijane rozliczenia kuponów pozostają na jednym ekranie.
- Zgłoszenie zbioru: gatunek, liczba sztuk, obowiązkowe zdjęcie z galerii lub aparatu, opcjonalna notatka.
- Zatwierdzanie i odrzucanie przez organizatora z powodem odrzucenia.
- Zakończenie dopiero po rozpatrzeniu wszystkich zgłoszeń.
- Wyniki zbiorów i punktacja wewnątrz konkretnej wyprawy oraz własne statystyki i domyślnie zwinięta, rozwijana historia wypraw w profilu.
- Zapis danych na urządzeniu. Zdjęcia na Androidzie/iOS są kopiowane z pamięci podręcznej do dokumentów aplikacji.
- Zdjęcia do 20 MB są przygotowywane jako JPEG o maksymalnym boku 1600 px. W przeglądarce plik po przygotowaniu musi mieścić się w 1 MB, żeby zachować możliwość zapisu lokalnego.
- Podczas wysyłania widać postęp. Błąd nie usuwa wybranego zdjęcia ani wpisanych danych; można ponowić zgłoszenie. Jeśli zapis zgłoszenia nie powiedzie się po wysłaniu zdjęcia, aplikacja usuwa nieużywany plik w Storage.
- Błąd odczytu nie usuwa istniejących zapisów i daje możliwość ponowienia.

## Dwa tryby wyprawy

Organizator wybiera tryb podczas tworzenia pokoju. Starsze pokoje pozostają w trybie Typowanie.

- **Typowanie**: cztery pytania, opcjonalny pewniak ×2 i punktacja opisana poniżej.
- **Kupony**: nowe 10 wirtualnych grzybków dla każdego na każdą wyprawę. Po otwarciu zakładów widać jedną stronę oferty: zwycięzca, własny zbiór, zbiór ekipy i najczęstszy gatunek. Nowy kupon łączy 1–3 typy (jeden na kategorię), kursy się mnożą. Własny zbiór i wynik ekipy są powiązane, więc trzeba stawiać je na oddzielnych kuponach; wybór jednego zastępuje drugi w formularzu. Stawka to pełne 1–10 grzybków; suma stawek nie przekracza 10. Pasek stawki i możliwej wygranej pozostaje nad dolną nawigacją podczas wybierania typów.
- Nowe pokoje używają `couponVersion: 2`. Kurs zwycięzcy wynosi `liczba graczy × 0.90` (np. 1.80 dla dwóch, 3.60 dla czterech). Własny zbiór ma tylko cele powyżej 5.5 / 10.5 / 20.5, bez nagradzania celowego niezbierania. Progi ekipy to `5 × liczba graczy + 0.5`, `10 × liczba graczy + 0.5`, `20 × liczba graczy + 0.5`; zapisujemy je jako tier `over-low` / `under-low`, `over-mid` / `under-mid`, `over-high` / `under-high`. Zwycięzca i wynik ekipy wymagają co najmniej dwóch graczy.
- Kursy są ustalone na czas pokoju; gatunki zachowują orientacyjny kurs `5.00` do późniejszego strojenia na historii wypraw. To mechanika punktowa, bez pieniędzy i zewnętrznego bukmachera. Kurs łączny zaokrąglamy do dwóch miejsc, rozliczenie prowadzimy w setnych grzybka. Kursy i progi nie są statystyczną prognozą zbiorów.
- Każdy sam kończy stawianie. Można zostać z niewydanym saldem lub bez kuponów. Po gotowości kuponów nie można już dopisywać; gospodarz rozpoczyna poszukiwania dopiero po gotowości wszystkich.
- W trakcie zbiorów nadal widać tylko Zbiory. Dopiero gospodarz kończy wyprawę i odsłania wyniki: każdy typ kuponu, trafienie, kurs, stawkę, wygraną i bilans. Kupon wygrywa, gdy trafione są wszystkie typy. Wygrana zawiera stawkę. W wersji 2 remis dzieli wygraną przez liczbę współzwycięzców i/lub najczęstszych gatunków, których dotyczy kupon. Dwa remisy mnożą dzielniki. Ostateczną wygraną zaokrąglamy w dół do 0.01 grzybka. Przy zerowych zbiorach nie ma zwycięzcy ani gatunku.
- Starsze pokoje `couponVersion: 1` zachowują dawną ofertę: 1–4 typy, kurs zwycięzcy `max(1.50, liczba graczy × 1.50)`, stare stałe progi i pełne wygrane przy remisach. Nie zmieniamy wersji istniejącego pokoju ani rozliczenia zapisanych kuponów.
- Ranking Kuponów porównuje stan końcowy: `10 − postawione stawki + wygrane ze stawką`. Kupony innych graczy są prywatne do zakończenia. Historia pokazuje oba tryby, statystyka punktów zachowuje wyłącznie klasyczne typowanie, a zbiory z obu trybów zasilają Grzybedex.
- Zapisy online dopisują kupon i odejmują saldo atomowo. Reguły blokują podmianę historii, stawki ponad saldo, własne kursy, edycję trybu i stawianie po gotowości lub starcie zbiorów. Testy tych zapisów używają emulatorów `demo-grzybet`.

## Zasady punktacji

Do wyników wliczamy wyłącznie zatwierdzone zbiory.

- Zwycięzca zbiorów: 100 pkt.
- Własna liczba grzybów i wynik ekipy: dokładnie 100 pkt; pomyłka o 1 szt. 80 pkt, o 2 szt. 60 pkt, o 3 szt. 40 pkt, o 4 szt. 30 pkt, o 5 szt. 20 pkt.
- Własny zbiór: pomyłka powyżej 5 szt. daje 0 pkt. Wynik ekipy: pomyłka o 6–10 szt. daje jeszcze 10 pkt, powyżej 10 szt. 0 pkt.
- Najczęstszy gatunek: 50 pkt.
- Przed zatwierdzeniem kuponu można wskazać jednego pewniaka ×2. Podwaja tylko punkty wybranego pytania, także przy częściowym trafieniu. Widać cztery pytania; ponowne dotknięcie wybranego pytania odznacza pewniaka. Po zatwierdzeniu nie można zmienić pewniaka.
- „Jak liczymy punkty?” to dyskretny przycisk z pytajnikiem, podobny do pomocy na ekranie głównym — dotknięcie rozwija lub chowa zasady. Nazwa pokoju jest ukryta przez cały etap typowania.
- Maksymalnie 450 pkt przy pewniaku na jednym z pytań za 100 pkt; przy pewniaku na gatunku maksymalnie 400 pkt, bez pewniaka 350 pkt.
- Nowe pokoje zapisują `scoringVersion: 2`. Starsze pokoje bez tej wersji zachowują pierwotne zasady (własny zbiór 100/70/40 pkt, ekipa tylko dokładnie), co chroni wyniki historii. Reguły Firestore dopuszczają wyłącznie cztery zapisane odpowiedzi i co najwyżej jeden poprawny klucz `boost`; nie można dopisać mnożnika ani podmienić odpowiedzi podczas zatwierdzania.
- Po zakończeniu otwiera się zakładka Wyniki z własnym podsumowaniem i listą wyników ekipy. Kupony są domyślnie zwinięte; dotknięcie wiersza uczestnika pokazuje typ, rzeczywisty wynik, różnicę liczbową, punkty bazowe i działanie ×2. Przed zakończeniem te rozliczenia są ukryte.
- Remisy mają wspólne miejsce. Każdy zwycięzca i każdy najczęstszy gatunek przy remisie zalicza trafienie.
- Przy zerowych zbiorach nie ma zwycięzcy ani najczęstszego gatunku; liczbowe typy na zero mogą zdobyć punkty.
- Kupon bez zapisanych typów: 0 pkt.
- Statystyki profilu sumują zakończone lokalne wyprawy; wspólne pierwsze miejsce z dodatnim wynikiem liczy się jako wygrana typowania.

## Jak sprawdzić pełną wyprawę

1. Utwórz nowy pokój. W wersji lokalnej jesteś w nim jedynym uczestnikiem, więc możesz sam sprawdzić pełny przebieg.
2. W lobby sprawdź, że zakładka Typowanie jest ukryta do rozpoczęcia pytań przez organizatora. Kod pokoju widać tylko w lobby; po rozpoczęciu typowania znika. W pokoju i podczas pytań nie wyświetlamy daty ani godziny startu.
3. Wybierz Rozpocznij typowanie i potwierdź.
4. Odpowiedz kolejno: Kuba, 12 własnych, 12 całej ekipy, Borowik.
5. Możesz zamknąć aplikację między pytaniami — po powrocie zobaczysz następne niezakończone pytanie.
6. W podsumowaniu wybierz „Twój zbiór” jako pewniaka ×2 i zatwierdź. W lobby zobaczysz Gotowi: 1 / 1, ale poszukiwania jeszcze nie wystartują.
7. Wybierz Wystartuj poszukiwania i potwierdź.
8. W Zbiorach wybierz Borowik, 12 sztuk i dołącz zdjęcie.
9. Wyślij zgłoszenie. Wynik pozostaje 0 do zatwierdzenia. Oczekujące zgłoszenie blokuje zakończenie.
10. Zatwierdź zgłoszenie i zakończ wyprawę w panelu organizatora pod zbiorami. U wszystkich graczy automatycznie otworzą się wyniki.
11. W Wynikach zobacz 12 grzybów i 450 pkt. Rozwiń swój wiersz, aby obejrzeć rozliczenie kuponu. Obok Wyników dostępna jest zakładka Zbiory; w Profilu znajdziesz historię i własne statystyki.

Przykładowe lobby w Gorcach: GRZ482. Dołączanie do drugiego przykładowego pokoju: LAS219.
Przykładowi uczestnicy nie odpowiadają automatycznie. W pokoju z kilkoma osobami przycisk poszukiwań pozostaje zablokowany, dopóki wszyscy nie potwierdzą typów.
Do wspólnej rozgrywki na kilku telefonach służy opisany poniżej tryb online.

Starsze zapisy są odczytywane bez usuwania historii. Dawne otwarte kupony stają się szkicami do potwierdzenia po starcie pytań, a dawne zamknięte typowanie przechodzi do oczekiwania na odpowiedzi brakujących uczestników.

## Gra online — Firebase

Dostępna jest integracja z Firebase JS SDK (zgodna z Expo Go):

- osobne, zapamiętywane konta gości i nick gracza,
- wspólne lobby i dołączanie kodem z kontrolą limitu w transakcji,
- automatyczne uruchomienie pytań u wszystkich po starcie organizatora,
- prywatne odpowiedzi, wspólna gotowość i start poszukiwań dopiero po zatwierdzeniu przez wszystkich,
- zdjęcia w Storage dostępne uczestnikom, weryfikacja przez organizatora oraz wspólne wyniki,
- reguły bazy i plików blokujące cudze odpowiedzi, nieuprawnione zmiany etapów i edycję zakończonych wypraw.

Pełny przebieg ze zdjęciami sprawdzono również w prawdziwym Firebase na niezależnych kontach gości: wspólne lobby, pytania, przesyłanie i pobieranie zdjęć, zatwierdzanie, odrzucanie oraz końcowe wyniki. Sprawdzono także blokadę dostępu do zdjęć dla osób spoza pokoju i pobieranie w przeglądarce. Projekt GrzyBet ma skonfigurowane Storage, reguły dostępu i CORS. Przy nowej konfiguracji Storage wymaga aktywacji planu Blaze i utworzenia domyślnego bucketa przez właściciela projektu; npm run firebase:photos wdraża pozostałe ustawienia. Szczegóły: [instrukcja Firebase](firebase/SETUP.md).

Bez konfiguracji działa dotychczasowy tryb lokalny. Istniejące lokalne wyprawy zostają zapisane na urządzeniu i nie są automatycznie kopiowane do chmury; są ponownie dostępne po wyłączeniu trybu online.

### Testy Firebase bez konta

Wymagane Node.js 24+ i Java 21+. Skrypt potrafi użyć Javy dołączonej do Android Studio na Windows.

- npm run test:cloud — uruchamia emulatory, testuje dwóch graczy i wyłącza emulatory.
- npm run emulators — uruchamia emulatory do ręcznych testów.
- Testy używają wyłącznie projektu demo-grzybet i nie korzystają z prawdziwej chmury.

Testowane scenariusze obejmują dwa takie same nicki, niezależną tożsamość, równoczesne dołączanie do ostatniego miejsca, prywatność typów, gotowość wszystkich, chronione zdjęcia, weryfikację, punktację i próby obejścia reguł.

Test regresji zdjęć odtwarza ograniczenie React Native: `new Blob([Uint8Array])` jest niedostępne. Sprawdza wysyłanie małych i większych plików przez Firebase SDK bez takiej konwersji. Android/iOS odczytuje plik przez XMLHttpRequest jako natywny Blob; jego pamięć zwalniamy po zakończeniu operacji. Wersja webowa korzysta z Blob przeglądarki.

## Kontrola kodu

- npm run lint
- npm run typecheck
- npm test
- npm run test:cloud
- npx.cmd expo export --platform android
- npx.cmd expo export --platform web

Automatyczne testy obejmują etapy i uprawnienia, walidację, punktację i remisy, trwałość danych oraz błędne zapisy.
UI sprawdzono w przeglądarce także na szerokości 390 px. Aparat, uprawnienia i wybór zdjęcia na fizycznym telefonie wymagają sprawdzenia na urządzeniu.

Kod funkcjonalności: src/features/. Trasy Expo Router: src/app/.

## Zabezpieczenia zdjęć i usuwania konta

- URI pobranego zdjęcia trafia do interfejsu dopiero po zakończeniu zapisu pliku. Nieudany zapis usuwa niepełną kopię; każda operacja używa osobnej nazwy cache. Wynik pobierania z poprzedniej sesji jest zwalniany i nie trafia do nowego profilu.
- Konto można usunąć dopiero po zakończeniu wszystkich wypraw, w których uczestniczy użytkownik — również gdy nie jest ich organizatorem. Okno pokazuje powód blokady. Przed usunięciem aplikacja dodatkowo sprawdza członkostwo bezpośrednio na serwerze; brak sieci lub uprawnień nie pozwala zatwierdzić operacji na podstawie starej pamięci danych. W pozostałych przypadkach nadal obowiązuje pięć sekund i pole potwierdzenia.
- Testy regresji obejmują opóźniony i odrzucony zapis zdjęcia, bezpieczne zwalnianie cache, obie role gracza na wszystkich aktywnych etapach oraz wyprawę utworzoną na drugim urządzeniu po wcześniejszym pustym odczycie.

## Oddanie projektu i push do GitHub

Pushuj po każdym sprawdzonym etapie prac. Przed oznaczeniem wersji do oddania uruchom kontrolę kodu z powyższej sekcji i sprawdź pełną wyprawę na dwóch telefonach. Do repozytorium mają trafić wszystkie nowe pliki źródłowe, zdjęcia, licencje i testy — sam zapis zmian w już śledzonych plikach ich nie dodaje.

Po sprawdzeniu listy zmian, w repozytorium z ustawionym zdalnym `origin`:

```powershell
git status --short
git diff
git add -u
git add src assets tests scripts firebase
git diff --cached --stat
git commit -m "Przygotuj GrzyBet do oddania"
git push -u origin HEAD
```

`git add -u` zbiera zmiany w śledzonych plikach, a następne polecenie dodaje także nowe pliki w katalogach aplikacji. Przed commitem przejrzyj zestaw zmian; lokalna konfiguracja `.env.local`, klucze podpisujące i pliki administratora pozostają poza repozytorium.

Po zapisie końcowego commita zbuduj z tej samej wersji świeży APK profilem `preview` i sprawdź instalację oraz wspólną grę. `expo export` sprawdza paczkę aplikacji, ale nie tworzy instalowalnego APK. Katalog `dist/` jest ignorowany przez Git: APK udostępnij osobno, np. jako plik wydania GitHub Releases albo link do buildu Expo. W opisie oddania podaj identyfikator commita, numer buildu, link do APK oraz sumę SHA-256 pobranego pliku. Źródła i pliki licencji pozostają w repozytorium.
