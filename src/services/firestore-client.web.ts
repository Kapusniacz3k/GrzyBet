import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export function clientFirestore(app: FirebaseApp) { return getFirestore(app); }
