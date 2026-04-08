import { create } from 'zustand';
import {
  createMockAccount,
  findMockAccountByEmail,
  normalizeAuthEmail,
  readAuthSessionUser,
  type AuthUser,
  writeAuthSessionUser,
} from '../lib/authStorage';

export type { AuthUser } from '../lib/authStorage';

interface AuthActionResult {
  success: boolean;
  message: string;
}

interface AuthState {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => AuthActionResult;
  signup: (name: string, email: string, password: string) => AuthActionResult;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: readAuthSessionUser(),
  login: (email, password) => {
    const normalizedEmail = normalizeAuthEmail(email);
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    const account = findMockAccountByEmail(normalizedEmail);

    if (!account) {
      return { success: false, message: 'Account has not been created.' };
    }

    if (account.password !== normalizedPassword) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    const nextUser: AuthUser = {
      email: account.email,
      name: account.name,
    };

    writeAuthSessionUser(nextUser);
    set({ currentUser: nextUser });

    return { success: true, message: 'Login successful.' };
  },
  signup: (name, email, password) => {
    const normalizedEmail = normalizeAuthEmail(email);
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword || !name.trim()) {
      return { success: false, message: 'Please complete all fields.' };
    }

    const created = createMockAccount({
      name,
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (!created.success) {
      return { success: false, message: 'Account already exists. Please log in.' };
    }

    const nextUser: AuthUser = {
      email: created.account.email,
      name: created.account.name,
    };

    writeAuthSessionUser(nextUser);
    set({ currentUser: nextUser });

    return { success: true, message: 'Account created successfully. You are now logged in.' };
  },
  logout: () => {
    writeAuthSessionUser(null);
    set({ currentUser: null });
  },
}));
