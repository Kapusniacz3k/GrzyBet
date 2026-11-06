import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export function persistentAuth(app: FirebaseApp) { return getAuth(app); }
