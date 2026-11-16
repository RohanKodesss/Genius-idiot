// Per-user opt-out from the setup gate ("Set up later").
const key = (userId) => `gi:setup-skipped:${userId}`;
const skippedInMemory = new Set();

export const hasSkippedSetup = (userId) =>
  Boolean(userId) && (skippedInMemory.has(userId) || safeGet(key(userId)) === '1');

export const skipSetup = (userId) => {
  if (!userId) return;
  skippedInMemory.add(userId);
  safeSet(key(userId), '1');
};

function safeGet(storageKey) {
  try {
    return globalThis.localStorage?.getItem(storageKey) ?? null;
  } catch {
    return null;
  }
}

function safeSet(storageKey, value) {
  try {
    globalThis.localStorage?.setItem(storageKey, value);
  } catch {
    // The setup gate is a convenience; storage restrictions must not block entry.
  }
}
