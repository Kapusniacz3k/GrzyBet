import type { FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

export function clientFirestore(app: FirebaseApp) {
  try {
    // Native XHR/proxies can buffer a streaming response indefinitely.
    return initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch (error) {
    // Fast Refresh may retain the previous instance. A full reload applies the transport setting.
    if ((error as { code?: string }).code === 'failed-precondition') return getFirestore(app);
    throw error;
  }
}
