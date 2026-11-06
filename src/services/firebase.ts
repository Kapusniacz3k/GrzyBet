import { initializeApp, getApps } from 'firebase/app';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { persistentAuth } from './persistent-auth';

export const onlineEnabled = process.env.EXPO_PUBLIC_FIREBASE_ENABLED === 'true';
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
let services: ReturnType<typeof createServices> | undefined;
function createServices() {
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId || !config.storageBucket) {
    throw new Error('Gra online nie jest jeszcze skonfigurowana.');
  }
  const app = getApps().find(item => item.name === 'grzybet-online') ?? initializeApp(config, 'grzybet-online');
  const auth = persistentAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  storage.maxUploadRetryTime = 45000;
  storage.maxOperationRetryTime = 15000;
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
  if (host) {
    if (!__DEV__ || !config.projectId.startsWith('demo-') || !/^[a-zA-Z0-9.-]+$/.test(host)) {
      throw new Error('Emulatory są dostępne tylko w lokalnym projekcie testowym.');
    }
    connectAuthEmulator(auth, 'http://' + host + ':9099', { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectStorageEmulator(storage, host, 9199);
  }
  return { app, auth, db, storage };
}
export function firebaseServices() {
  services ??= createServices();
  return services;
}
