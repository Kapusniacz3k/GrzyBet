# GrzyBet

Mobilna aplikacja Expo SDK 58 / React Native / TypeScript do typowania wyników grzybobrania i rozliczania wypraw.

## Uruchomienie na Windows

Wymagany Node.js 24 lub nowszy (testy uruchamiają pliki TypeScript bez dodatkowego kompilatora).

- Zainstaluj zależności: npm install
- Uruchom: npx.cmd expo start --go --clear
- Połącz komputer i telefon z tą samą siecią Wi-Fi i zeskanuj kod QR w Expo Go.
- Jeżeli połączenie lokalne nie działa: npx.cmd expo start --go --clear --tunnel ngrok
- Wersja przeglądarkowa: npx.cmd expo start --web

ImagePicker, ImageManipulator, FileSystem i AsyncStorage są dostępne w zgodnej wersji Expo Go.
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
- Prosty ekran łączenia i wczytywania: logo GrzyBet, grzyb bez otaczających okręgów oraz „Łączenie z aplikacją…” ze wskaźnikiem ładowania. Przy błędzie można ponowić próbę.
- Ikona aplikacji to biało-zielony napis GrzyBet na ciemnym tle, w stylu nagłówka ekranu głównego. Przygotowane są też warstwy adaptacyjna i monochromatyczna Androida, ikona iOS i favicon. Systemowy ekran startowy ma ten sam grzyb bez okręgów, z jasnym i ciemnym tłem. Ikona i systemowy ekran startowy wymagają nowego builda preview/produkcyjnego; Expo Go nie odwzorowuje ich w pełni. Źródła wektorowe i opis plików: assets/branding/README.md.
- Ekran startowy z dużym grzybem oraz przyciskami Stwórz pokój i Dołącz do pokoju.
- Przycisk „Jak to działa?” otwiera instrukcję w oknie z rozwijanymi rozdziałami i zasadami punktacji.
- Wspólny dolny pasek zawiera Start, Grzybdex i Profil. Jest widoczny także w profilu, kartach grzybów i pokojach, a w ustawieniach znika.
- Grzybdex ma 20 gatunków, m.in. borowiki, podgrzybki, maślaki, koźlarze, rydza, kanię, opieńkę, lejkowca i gołąbka. Każdy ma osobny kafelek, zdjęcie, notatkę i postęp rang. Karta pokazuje zdjęcie, łączny własny zbiór, rekord jednej wyprawy i liczbę wypraw ze znaleziskiem. Statystyki obejmują tylko własne zatwierdzone sztuki z rozpoczętych poszukiwań i zakończonych wypraw.
- Gatunek w typowaniu i zgłoszeniu zbioru wybiera się z rozwijanej listy z wyszukiwaniem. Wyszukiwanie uwzględnia nazwy potoczne, naukowe i zapis bez polskich znaków. Dotychczasowe klucze Borowik, Podgrzybek, Maślak i Kurka pozostają zgodne ze starszymi zapisami.
- Nieodkryte gatunki mają szarą kłódkę zamiast zdjęcia. Pierwsza zatwierdzona sztuka odblokowuje zdjęcie i krótką notatkę z podanym źródłem. Karta pokazuje obecną rangę i liczbę sztuk do kolejnej, bez listy wszystkich rang.
- Nagłówek Grzybdexu i podsumowanie gatunków, sztuk oraz odznak są przypięte u góry; przewija się tylko lista kafelków.
- Odznaki zdobywa się osobno dla każdego gatunku: Drewno 1, Brąz 10, Srebro 50, Złoto 100, Diament 250, Grzybiarz 1000 sztuk. Postęp jest wyliczany z aktualnych zgłoszeń, bez osobnego zapisu liczników. Zdjęcia są dołączone do aplikacji; autorzy i poszczególne licencje są w assets/images/grzybdex/CREDITS.md oraz w odblokowanej karcie gatunku.
- Ustawienia są dostępne pod ikoną w prawym górnym rogu.
- Profil ma kartę z inicjałem i nickiem, duże liczniki zbiorów i punktów, zwięzłe statystyki, rozwijaną historię z podsumowaniami oraz karty aktywnych kuponów. Ustawienia są pod ikoną w nagłówku.
- Jeden przycisk Wznów grę pozwala wrócić do ostatniej aktywnej wyprawy.
- Ustawienie podpowiedzi w pytaniach zapisuje się lokalnie.
- Tworzenie pokoju z przyszłą datą i limitem uczestników oraz dołączanie kodem.
- Lobby, pytania po jednym i jeden zatwierdzony kupon na uczestnika.
- Etapy: lobby → pytania → oczekiwanie na gotowość wszystkich → poszukiwania → zakończona wyprawa.
- Organizator najpierw uruchamia pytania przyciskiem Start. Dołączanie jest dostępne tylko w lobby. Data wyprawy jest informacyjna i nie uruchamia etapów.
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

## Zasady punktacji

Do wyników wliczamy wyłącznie zatwierdzone zbiory.

- Zwycięzca zbiorów: 100 pkt.
- Własna liczba grzybów: dokładnie 100 pkt; pomyłka do 3 szt. 70 pkt; do 5 szt. 40 pkt.
- Dokładna liczba grzybów całej ekipy: 100 pkt.
- Najczęstszy gatunek: 50 pkt.
- Maksymalnie 350 pkt.
- Remisy mają wspólne miejsce. Każdy zwycięzca i każdy najczęstszy gatunek przy remisie zalicza trafienie.
- Przy zerowych zbiorach nie ma zwycięzcy ani najczęstszego gatunku; liczbowe typy na zero mogą zdobyć punkty.
- Kupon bez zapisanych typów: 0 pkt.
- Statystyki profilu sumują zakończone lokalne wyprawy; wspólne pierwsze miejsce z dodatnim wynikiem liczy się jako wygrana typowania.

## Jak sprawdzić pełną wyprawę

1. Utwórz nowy pokój. W wersji lokalnej jesteś w nim jedynym uczestnikiem, więc możesz sam sprawdzić pełny przebieg.
2. W lobby sprawdź, że Typowanie pokazuje oczekiwanie na organizatora.
3. Wybierz Start — rozpocznij pytania i potwierdź.
4. Odpowiedz kolejno: Kuba, 12 własnych, 12 całej ekipy, Borowik.
5. Możesz zamknąć aplikację między pytaniami — po powrocie zobaczysz następne niezakończone pytanie.
6. Zatwierdź podsumowanie. W lobby zobaczysz Gotowi: 1 / 1, ale poszukiwania jeszcze nie wystartują.
7. Wybierz Wystartuj poszukiwania i potwierdź.
8. W Zbiorach wybierz Borowik, 12 sztuk i dołącz zdjęcie.
9. Wyślij zgłoszenie. Wynik pozostaje 0 do zatwierdzenia. Oczekujące zgłoszenie blokuje zakończenie.
10. Zatwierdź zgłoszenie i zakończ wyprawę w panelu organizatora pod zbiorami. U wszystkich graczy automatycznie otworzą się wyniki.
11. W Wynikach zobacz 12 grzybów i 350 pkt; w Profilu historię i własne statystyki.

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
