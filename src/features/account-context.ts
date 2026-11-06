import { createContext, useContext } from 'react';

export type Account = {
  isGuest: boolean;
  email: string;
  busy: boolean;
  hasGuestProgress: boolean;
  register: (email: string, password: string, confirmation: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  remove: (password?: string) => Promise<void>;
};

export const AccountContext = createContext<Account | null>(null);
export function useAccount() { return useContext(AccountContext); }
