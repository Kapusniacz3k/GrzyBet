# GrzyBet

Mobilna aplikacja Expo SDK 58 / React Native / TypeScript do typowania wyników grzybobrania i rozliczania wypraw.

## Uruchomienie na Windows

Wymagany Node.js 24 lub nowszy (testy uruchamiają pliki TypeScript bez dodatkowego kompilatora).

- Zainstaluj zależności: npm install
- Uruchom: npx.cmd expo start --go --clear
- Połącz komputer i telefon z tą samą siecią Wi-Fi i zeskanuj kod QR w Expo Go.
- Jeżeli połączenie lokalne nie działa: npx.cmd expo start --go --clear --tunnel ngrok
- Wersja przeglądarkowa: npx.cmd expo start --web

ImagePicker, ImageManipulator, FileSystem, AsyncStorage i react-native-svg są dostępne w zgodnej wersji Expo Go.
Własna instalowalna aplikacja wymaga development build / EAS Build; polskie opisy uprawnień i konfiguracja aparatu są w app.json.

## Instalowana wersja Android — APK

Profil `preview` w `eas.json` tworzy podpisany plik APK do bezpośredniej instalacji, bez Expo Go i bez uruchamiania komputera. Identyfikator Androida: `pl.grzybet.app`. Numer builda jest zarządzany przez Expo i rośnie automatycznie. Profil zawiera publiczną konfigurację klienta Firebase `grzybet`, tak aby wspólna gra działała także bez lokalnego `.env.local`.

1. Zaloguj się na własne konto Expo: `npx.cmd --yes eas-cli@latest login`.
2. Przy pierwszym uruchomieniu połącz projekt z kontem: `npx.cmd --yes eas-cli@latest init`.
3. Uruchom budowanie: `npx.cmd --yes eas-cli@latest build --platform android --profile preview`.
4. Otwórz otrzymany link na Androidzie, pobierz APK i zainstaluj. Tę samą wersję możesz zainstalować na drugim telefonie.

Przy pierwszym budowaniu wybierz wygenerowanie klucza podpisującego przez Expo. Zachowaj ten projekt i klucz przy następnych wersjach, aby dało się aktualizować aplikację z zachowaniem jej danych. Instalowana aplikacja ma osobną pamięć niż Expo Go, więc za pierwszym razem poprosi o nick i utworzy własne konto gościa.

`.easignore` wyłącza z paczki m.in. lokalne pliki środowiskowe, pamięć podręczną, testy i klucze podpisujące. Publiczne parametry Firebase w `eas.json` nie są danymi administratora; dostęp do danych nadal ograniczają reguły Firestore i Storage.

## Co działa

- Jasny i ciemny motyw wybierane w Ustawienia → Wygląd aplikacji. Wybór zapisuje się na urządzeniu razem z podpowiedziami i obejmuje ekrany, formularze, nawigację, instrukcję oraz łączenie z aplikacją.
- Jeśli na Pixelu jasny motyw w Expo Go pozostaje ciemny, sprawdź systemowy rozszerzony ciemny motyw. Wyłącz go dla Expo Go lub wybierz Standardowy; rozszerzona opcja przetwarza kolory niezależnie od palety aplikacji. [Instrukcja Google](https://support.google.com/accessibility/android/answer/6151800?hl=pl).
- Krótkie animacje wejścia ekranów i kafelków, sprężysta reakcja przycisków, płynne przejścia, rozwijanie instrukcji i historii oraz subtelny ruch grzyba podczas łączenia. Animacje respektują systemowe ograniczenie ruchu.
- Ikony w interfejsie są rysowane przez `react-native-svg`: grzyb, Grzybedex, profil, kłódka, ustawienia, pomoc, historia, odznaki i symbole przycisków. Wspólny zestaw jest w `src/components/grzybet-icons.tsx`; rozmiary i kolory dopasowują się do miejsca użycia oraz motywu. Dekoracyjne ikony nie przechwytują dotyku ani nie powielają etykiet przycisków w czytniku ekranu. Istniejący APK wymaga ponownego zbudowania, aby zawierał nową bibliotekę; w Expo Go wystarczy odświeżyć projekt.
- Prosty ekran łączenia i wczytywania: logo GrzyBet, grzyb bez otaczających okręgów oraz „Łączenie z aplikacją…” ze wskaźnikiem ładowania. Przy błędzie można ponowić próbę.
- Ikona aplikacji to biało-zielony napis GrzyBet na ciemnym tle, w stylu nagłówka ekranu głównego. Przygotowane są też warstwy adaptacyjna i monochromatyczna Androida, ikona iOS i favicon. Systemowy ekran startowy ma ten sam grzyb bez okręgów, z jasnym i ciemnym tłem. Ikona i systemowy ekran startowy wymagają nowego builda preview/produkcyjnego; Expo Go nie odwzorowuje ich w pełni. Źródła wektorowe i opis plików: assets/branding/README.md.
- Ekran startowy z dużym grzybem oraz przyciskami Stwórz pokój i Dołącz do pokoju.
- Przycisk „Jak to działa?” otwiera instrukcję w oknie z rozwijanymi rozdziałami i zasadami punktacji.
- Wspólny dolny pasek zawiera Start, Grzybedex i Profil. Jest widoczny także w profilu, kartach grzybów i pokojach, a w ustawieniach znika.
- Grzybedex ma 20 gatunków, m.in. borowiki, podgrzybki, maślaki, koźlarze, rydza, kanię, opieńkę, lejkowca i gołąbka. Każdy ma osobny kafelek, zdjęcie, notatkę i postęp rang. Karta pokazuje zdjęcie, łączny własny zbiór, rekord jednej wyprawy i liczbę wypraw ze znaleziskiem. Statystyki obejmują tylko własne zatwierdzone sztuki z rozpoczętych poszukiwań i zakończonych wypraw.
- Gatunek w typowaniu i zgłoszeniu zbioru wybiera się z rozwijanej listy z wyszukiwaniem. Wyszukiwanie uwzględnia nazwy potoczne, naukowe i zapis bez polskich znaków. Dotychczasowe klucze Borowik, Podgrzybek, Maślak i Kurka pozostają zgodne ze starszymi zapisami.
- Nieodkryte gatunki mają szarą kłódkę zamiast zdjęcia. Pierwsza zatwierdzona sztuka odblokowuje zdjęcie i krótką notatkę z podanym źródłem. Karta pokazuje obecną rangę i liczbę sztuk do kolejnej, bez listy wszystkich rang.
- Nagłówek Grzybedexu i podsumowanie gatunków, sztuk oraz odznak są przypięte u góry; przewija się tylko lista kafelków. Mniejszy nagłówek, podsumowanie i kafelki pozwalają pokazać dwa pełne rzędy grzybów na ekranie telefonu.
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
- Po wystartowaniu poszukiwań dostępna jest tylko zakładka Zbiory. Wyniki pojawiają się automatycznie po zakończeniu grzybobrania przez organizatora; wtedy można też przeglądać zapisane zbiory.
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
- **Kupony**: nowe 10 wirtualnych grzybków dla każdego na każdą wyprawę. Po otwarciu zakładów widać jedną stronę oferty: zwycięzca, własny zbiór, zbiór ekipy i najczęstszy gatunek. Kupon łączy 1–4 typy (jeden na kategorię), kursy się mnożą. Stawka to pełne 1–10 grzybków; suma stawek nie przekracza 10. Pasek stawki i możliwej wygranej pozostaje nad dolną nawigacją podczas wybierania typów.
- Kursy wersji 1 są z góry ustalone. Kurs zwycięzcy wynosi `max(1.50, liczba graczy × 1.50)`, gatunku `5.00`, a linie liczbowe mają kursy z `couponLines`. To mechanika punktowa, bez pieniędzy i zewnętrznego bukmachera. Kurs łączny zaokrąglamy do dwóch miejsc, rozliczenie prowadzimy w setnych grzybka.
- Każdy sam kończy stawianie. Można zostać z niewydanym saldem lub bez kuponów. Po gotowości kuponów nie można już dopisywać; gospodarz rozpoczyna poszukiwania dopiero po gotowości wszystkich.
- W trakcie zbiorów nadal widać tylko Zbiory. Dopiero gospodarz kończy wyprawę i odsłania wyniki: każdy typ kuponu, trafienie, kurs, stawkę, wygraną i bilans. Kupon wygrywa, gdy trafione są wszystkie typy. Wygrana zawiera stawkę. Przy remisie trafia każdy wspólny zwycięzca lub najczęstszy gatunek; przy zerowych zbiorach nie ma zwycięzcy ani gatunku.
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
- Po zakończeniu wyniki domyślnie otwierają typowanie z rozwiniętym własnym kuponem: typ, rzeczywisty wynik, różnica liczbowa, punkty bazowe i działanie ×2. Pozostałe kupony rozwija się osobno; przed zakończeniem te rozliczenia są ukryte.
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
11. W Wynikach zobacz 12 grzybów i 450 pkt z rozpisanym kuponem; w Profilu historię i własne statystyki.

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
