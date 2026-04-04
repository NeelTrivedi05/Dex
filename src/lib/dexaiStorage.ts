export const DEXAI_KEYS = {
  TASKS: 'dexai_tasks',
  SUBJECTS: 'dexai_subjects',
  RESOURCES: 'dexai_resources',
} as const;

export function readDexaiJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeDexaiJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function collectDexaiData(): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('dexai_')) {
      data[key] = localStorage.getItem(key) || '';
    }
  }
  return data;
}

export function clearDexaiData(exclude: string[] = []): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('dexai_') && !exclude.includes(key)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}