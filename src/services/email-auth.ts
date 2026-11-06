import { deleteUser, EmailAuthProvider, linkWithCredential, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, type Auth } from 'firebase/auth';

export function accountEmail(value: string): string {
  const email = value.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Wpisz poprawny adres e-mail.');
  return email;
}

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8) throw new Error('Hasło musi mieć co najmniej 8 znaków.');
  if (password !== confirmation) throw new Error('Hasła muszą być takie same.');
}

/** Link the guest in place: room membership and collection progress use this UID. */
export async function registerGuestAccount(auth: Auth, email: string, password: string, confirmation: string) {
  const clean = accountEmail(email);
  validateNewPassword(password, confirmation);
  const user = auth.currentUser;
  if (!user?.isAnonymous) throw new Error('Konto jest już zabezpieczone. Aby użyć innego konta, najpierw się wyloguj.');
  const displayName = user.displayName;
  const linked = (await linkWithCredential(user, EmailAuthProvider.credential(clean, password))).user;
  if (displayName && linked.displayName !== displayName) await updateProfile(linked, { displayName });
  return linked;
}

export async function signInAccount(auth: Auth, email: string, password: string) {
  const clean = accountEmail(email);
  if (!password) throw new Error('Wpisz hasło.');
  return (await signInWithEmailAndPassword(auth, clean, password)).user;
}

export async function resetAccountPassword(auth: Auth, email: string) {
  const clean = accountEmail(email);
  auth.languageCode = 'pl';
  try { await sendPasswordResetEmail(auth, clean); }
  catch (error) {
    // Give the same response regardless of whether an address is registered.
    if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
  }
}

export async function signOutAccount(auth: Auth) { await signOut(auth); }

export async function removeAccount(auth: Auth, password?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Najpierw zaloguj się na konto, które chcesz usunąć.');
  if (password !== undefined) {
    if (!password) throw new Error('Wpisz hasło, aby potwierdzić usunięcie konta.');
    if (!user.email) throw new Error('Profil gościa nie ma hasła. Otwórz ponownie okno usuwania profilu.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  }
  await deleteUser(user);
}

export function accountError(error: unknown): string {
  const code = (error as { code?: string }).code;
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(code ?? '')) return 'Nieprawidłowy e-mail lub hasło.';
  if (code === 'auth/invalid-email') return 'Wpisz poprawny adres e-mail.';
  if (['auth/email-already-in-use', 'auth/credential-already-in-use', 'auth/account-exists-with-different-credential'].includes(code ?? '')) return 'Ten e-mail jest już przypisany do konta. Zaloguj się lub zresetuj hasło. Obecny profil gościa nadal jest dostępny.';
  if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') return 'Hasło nie spełnia wymagań. Użyj co najmniej 8 znaków, wielkiej i małej litery, cyfry oraz znaku specjalnego.';
  if (code === 'auth/too-many-requests') return 'Za dużo prób. Poczekaj chwilę i spróbuj ponownie.';
  if (code === 'auth/network-request-failed') return 'Nie udało się połączyć. Sprawdź internet i spróbuj ponownie.';
  if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') return 'Logowanie e-mailem jest chwilowo niedostępne. Spróbuj ponownie później.';
  if (code === 'auth/user-disabled') return 'To konto jest wyłączone. Skontaktuj się z organizatorem aplikacji.';
  if (code === 'auth/requires-recent-login') return 'Potwierdź swoje hasło, aby usunąć konto.';
  if (!code && error instanceof Error) return error.message;
  return 'Nie udało się wykonać operacji na koncie. Spróbuj ponownie.';
}
