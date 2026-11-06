# Podłączenie GrzyBet do Firebase

Aplikacja obsługuje wspólną grę przez Firebase i osobny tryb lokalny. Poniższa instrukcja opisuje przygotowanie usług. Bez konfiguracji działa tryb lokalny; zapisane lokalnie wyprawy nie są automatycznie wysyłane do internetu.

## 1. Utwórz projekt i aplikację webową

Otwórz [konsolę Firebase](https://console.firebase.google.com/), wybierz **Utwórz projekt** i nazwij go np. GrzyBet. Google Analytics nie jest potrzebne.

W ustawieniach projektu dodaj aplikację ikoną **Web (`</>`)**. To poprawny typ również dla Expo Go na Androidzie i iOS — korzystamy z Firebase JS SDK. Nie potrzebujesz konta administratora w pliku ani plików Google Services dla natywnego SDK.

Skopiuj konfigurację `firebaseConfig`. Potrzebne są publiczne pola: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`. Nie przekazuj hasła Google, pliku service account ani klucza prywatnego.

## 2. Włącz logowanie gości i bazę

- **Authentication → Sign-in method → Anonymous → Enable.**
- **Firestore Database → Create database.** Wybierz Standard edition, lokalizację w Europie i tryb production. Reguły wdrożysz z projektu; nie włączaj publicznego zapisu.

Te usługi pozwalają uruchomić wspólne lobby i pytania w ramach limitów planu Spark. Dostępność i limity sprawdzisz w [planach Firebase](https://firebase.google.com/pricing).

## 3. Zdjęcia

**Storage → Get started.** Obecnie Cloud Storage wymaga planu **Blaze**, który wiąże się z kontem rozliczeniowym i możliwością naliczania opłat. Nie włączaj go, jeśli nie chcesz jeszcze uruchamiać płatnych usług. Kod zdjęć można do tego czasu testować w lokalnym emulatorze. [Wymaganie Storage](https://firebase.google.com/docs/storage/web/start)

Limit zdjęcia w wersji online: 5 MB. Pliki pobierają tylko uczestnicy pokoju; dokumenty nie zawierają publicznych linków pobierania. Nie można podmieniać zdjęcia istniejącego zgłoszenia.

Aplikacja przyjmuje zdjęcia do 20 MB i przygotowuje JPEG o maksymalnym boku 1600 px. W przeglądarce wynikowy plik musi mieć do 1 MB. Oryginał w galerii nie jest zmieniany. Przy wysyłaniu widać postęp, a błąd zachowuje formularz do ponowienia próby.

Po aktywacji Blaze utwórz domyślny bucket w Storage w trybie produkcyjnym. Dla skonfigurowanego projektu GrzyBet uruchom:

```powershell
npm.cmd run firebase:photos
```

Skrypt używa istniejącego zalogowania Firebase, nadaje kontu usługi Storage wymaganą rolę `roles/firebaserules.firestoreServiceAgent`, wdraża reguły Storage i dodaje do CORS adresy z `firebase/storage-cors.json`, zachowując wcześniejszą konfigurację. Ta rola pozwala regułom zdjęć sprawdzać uczestników pokoju w Firestore. Skrypt ustawia ją jawnie, ponieważ Firebase CLI pomija ten krok w trybie nieinteraktywnym. Reguły nadal wymagają członkostwa w pokoju. Skrypt nie tworzy konta rozliczeniowego ani nie aktywuje płatnego planu. Sam odczyt gotowości, bez wdrażania:

```powershell
npm.cmd run firebase:photos -- --check
```

Nowo nadane uprawnienie usługi może potrzebować kilku minut, zanim zadziała przy przesyłaniu zdjęć. Google opisuje typowy czas propagacji zmian IAM jako około 2 minuty, czasem 7 minut lub dłużej. W tym czasie pierwsza próba może dostać odmowę dostępu; po zastosowaniu zmiany można ponowić zgłoszenie. [Propagacja uprawnień IAM](https://docs.cloud.google.com/iam/docs/access-change-propagation)

## 4. Konfiguracja aplikacji

W katalogu projektu skopiuj `.env.example` jako `.env.local`. Uzupełnij publiczne wartości z aplikacji Web i zmień:

```dotenv
EXPO_PUBLIC_FIREBASE_ENABLED=true
```

Nie ustawiaj `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` dla prawdziwego projektu. Nie wpisuj konfiguracji testowej `demo-*` do produkcji. `.env.local` jest ignorowany przez Git.

Wartości `EXPO_PUBLIC_*` trafiają do aplikacji, więc nie są miejscem na sekrety. Dostęp do danych ograniczają reguły bazy i Storage.

## 5. Wdrożenie reguł

Po zalogowaniu do własnego konta w terminalu PowerShell:

```powershell
npx.cmd firebase login
npx.cmd firebase deploy --only firestore:rules,storage --project TWOJ_PROJECT_ID
```

Jeśli Storage nie jest jeszcze aktywne, wdrożysz samą bazę:

```powershell
npx.cmd firebase deploy --only firestore:rules --project TWOJ_PROJECT_ID
```

Przy wdrażaniu reguł Storage Firebase może poprosić o przyznanie kontu usługi Storage dostępu do odczytu Firestore. Jest potrzebny do sprawdzania członkostwa w pokoju.

Uruchom ponownie Expo, aby wczytać konfigurację:

```powershell
npx.cmd expo start --go --clear --tunnel ngrok
```

## 6. Sprawdzenie na dwóch telefonach

1. Na każdym telefonie uruchom tę samą wersję aplikacji i podaj własny nick.
2. Pierwszy gracz tworzy pokój, drugi wpisuje kod.
3. Organizator widzi obie osoby i uruchamia pytania; u obu pojawia się pierwsze pytanie.
4. Każdy odpowiada we własnym tempie. Ponowne uruchomienie aplikacji zachowuje tożsamość gościa i postęp.
5. Po potwierdzeniu wszystkich odpowiedzi organizator uruchamia poszukiwania.
6. Gracz przesyła zdjęcie. Na obu telefonach pojawia się oczekujące zgłoszenie; wynik jeszcze nie rośnie. Organizator widzi przyciski zatwierdzania i odrzucania.
7. Organizator zatwierdza zgłoszenie albo odrzuca je z powodem. Do wyniku trafiają tylko zatwierdzone grzyby. Oczekujące zgłoszenia blokują zakończenie wyprawy.
8. Organizator kończy wyprawę pod zbiorami; wszystkim otwierają się te same końcowe wyniki. Zbiory i decyzje pozostają tylko do odczytu.
9. Sprawdź też przerwane wysyłanie: po błędzie zdjęcie i liczba pozostają w formularzu do ponowienia. Po ponownym wejściu do pokoju zapisane zgłoszenia wracają.

Dwie osoby mogą mieć taki sam nick — rozróżniamy je identyfikatorem konta. Przy powtarzających się nickach pojawia się krótki wyróżnik. Konto gościa jest związane z zapisem na urządzeniu; usunięcie danych aplikacji może spowodować utratę dostępu. Po późniejszym dodaniu kont stałych będzie można powiązać konto gościa z logowaniem.

## Lokalne testy bez konta Firebase

```powershell
npm run test:cloud
```

Skrypt uruchamia emulatory Authentication, Firestore i Storage dla `demo-grzybet`, wykonuje testy dwóch niezależnych graczy i wyłącza emulatory. Nie korzysta z prawdziwej chmury. Potrzebna jest Java 21 lub nowsza. Na Windows skrypt potrafi użyć Javy dołączonej do Android Studio.

W `package.json` znajduje się override dla `@grpc/grpc-js` używanego przez Firestore w Node.js. Firebase przypina starszą gałąź; override wybiera wersję z poprawkami GHSA-m9gg-hp2v-232j i GHSA-f596-whhp-79r4. Testy emulatorów obejmują ten zestaw zależności.

Do ręcznego testowania emulatorów w przeglądarce użyj konfiguracji `demo-grzybet`, `apiKey=demo-key`, `authDomain=demo-grzybet.firebaseapp.com`, `storageBucket=demo-grzybet.firebasestorage.app`, `appId=1:123456:web:demo` i hosta `127.0.0.1`. Oddzielne adresy `localhost` oraz `127.0.0.1` pozwalają testować dwa niezależne konta w jednej przeglądarce.

Emulatory domyślnie nasłuchują wyłącznie lokalnie. Test telefonu wymaga świadomego udostępnienia ich w zaufanej sieci i podania adresu komputera; nie należy wystawiać emulatorów do publicznego internetu.

Wersja webowa pobiera chronione zdjęcia przez Storage SDK. Jeśli własna domena webowa wymaga konfiguracji CORS bucketa, skonfiguruj dozwolone pochodzenie zgodnie z [dokumentacją pobierania plików](https://firebase.google.com/docs/storage/web/download-files#download_data_directly_via_the_sdk).
