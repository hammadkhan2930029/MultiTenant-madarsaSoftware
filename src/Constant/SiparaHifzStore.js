const STORAGE_KEY = 'madarsa_hifz_sipara_entries';
const STORE_EVENT = 'madarsa-hifz-sipara-updated';

const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readEntries = () => {
  if (!canUseStorage) return [];

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeEntries = (entries) => {
  if (!canUseStorage) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
};

export const getSiparaJaizaEntries = () => readEntries();

export const saveSiparaJaizaEntry = (entry) => {
  const entries = readEntries();
  const index = entries.findIndex((item) => item.id === entry.id);

  if (index >= 0) {
    const updatedEntry = {
      ...entries[index],
      ...entry,
      updatedAt: new Date().toISOString(),
    };

    const nextEntries = [...entries];
    nextEntries[index] = updatedEntry;
    writeEntries(nextEntries);
    return updatedEntry;
  }

  const createdEntry = {
    ...entry,
    id: entry.id || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeEntries([createdEntry, ...entries]);
  return createdEntry;
};

export const subscribeToSiparaJaizaEntries = (callback) => {
  if (!canUseStorage) return () => {};

  const handler = () => callback(readEntries());
  window.addEventListener(STORE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(STORE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
