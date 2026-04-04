export interface MockAccount {
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface AuthUser {
  email: string;
  name: string;
}

const MOCK_DB_KEY = 'dex_mock_auth_accounts';
const AUTH_SESSION_KEY = 'dex_auth_session_user';

export const MOCK_LOGIN_CREDENTIALS = {
  email: 'student@dex.app',
  password: 'DexPass123',
};

const SEED_ACCOUNT: MockAccount = {
  email: MOCK_LOGIN_CREDENTIALS.email,
  password: MOCK_LOGIN_CREDENTIALS.password,
  name: 'Dex Student',
  createdAt: '2025-01-01T00:00:00.000Z',
};

export const normalizeAuthEmail = (value: string): string => value.trim().toLowerCase();

export const sanitizeAuthName = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Student';
  return trimmed.slice(0, 80);
};

const parseAccounts = (): MockAccount[] => {
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry) => {
        const candidate = entry as Record<string, unknown>;
        const email = typeof candidate.email === 'string' ? normalizeAuthEmail(candidate.email) : '';
        const password = typeof candidate.password === 'string' ? candidate.password : '';
        const name = typeof candidate.name === 'string' ? sanitizeAuthName(candidate.name) : 'Student';
        const createdAt = typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString();

        if (!email || !password) return null;
        return { email, password, name, createdAt };
      })
      .filter((entry): entry is MockAccount => entry !== null);
  } catch {
    return [];
  }
};

const persistAccounts = (accounts: MockAccount[]) => {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(accounts));
};

export const getMockAccounts = (): MockAccount[] => {
  const accounts = parseAccounts();
  const seedEmail = normalizeAuthEmail(SEED_ACCOUNT.email);

  if (accounts.length === 0) {
    persistAccounts([SEED_ACCOUNT]);
    return [SEED_ACCOUNT];
  }

  const hasSeed = accounts.some((account) => normalizeAuthEmail(account.email) === seedEmail);
  if (hasSeed) {
    return accounts;
  }

  const next = [SEED_ACCOUNT, ...accounts];
  persistAccounts(next);
  return next;
};

export const findMockAccountByEmail = (email: string): MockAccount | undefined => {
  const normalizedEmail = normalizeAuthEmail(email);
  return getMockAccounts().find((account) => normalizeAuthEmail(account.email) === normalizedEmail);
};

export const createMockAccount = (params: {
  name: string;
  email: string;
  password: string;
}): { success: true; account: MockAccount } | { success: false } => {
  const normalizedEmail = normalizeAuthEmail(params.email);
  const normalizedName = sanitizeAuthName(params.name);
  const normalizedPassword = params.password.trim();

  const accounts = getMockAccounts();
  const exists = accounts.some((account) => normalizeAuthEmail(account.email) === normalizedEmail);

  if (exists) {
    return { success: false };
  }

  const newAccount: MockAccount = {
    email: normalizedEmail,
    password: normalizedPassword,
    name: normalizedName,
    createdAt: new Date().toISOString(),
  };

  const next = [...accounts, newAccount];
  persistAccounts(next);

  return { success: true, account: newAccount };
};

export const readAuthSessionUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;

    const email = typeof parsed.email === 'string' ? normalizeAuthEmail(parsed.email) : '';
    const name = typeof parsed.name === 'string' ? sanitizeAuthName(parsed.name) : 'Student';

    if (!email) return null;
    return { email, name };
  } catch {
    return null;
  }
};

export const writeAuthSessionUser = (user: AuthUser | null) => {
  if (!user) {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
};
