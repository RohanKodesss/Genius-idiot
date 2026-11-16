// One-time "How it works" onboarding, remembered per user in this browser
// (same pattern as setupGate.js — no schema change, no new table).
const key = (userId) => `gi:guide-seen:${userId}`;
const seenInMemory = new Set();

export const hasSeenGuide = (userId) =>
  Boolean(userId) && (seenInMemory.has(userId) || safeGet(key(userId)) === '1');

export const markGuideSeen = (userId) => {
  if (!userId) return;
  seenInMemory.add(userId);
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
    // Remembering the guide is optional; browser storage may be unavailable.
  }
}
