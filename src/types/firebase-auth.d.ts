import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

// The RN runtime exports this public API; the SDK's shared type entry omits it.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
