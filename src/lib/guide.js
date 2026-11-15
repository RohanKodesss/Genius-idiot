// One-time "How it works" onboarding, remembered per user in this browser
// (same pattern as setupGate.js — no schema change, no new table).
const key = (userId) => `gi:guide-seen:${userId}`;

export const hasSeenGuide = (userId) =>
  Boolean(userId) && localStorage.getItem(key(userId)) === '1';

export const markGuideSeen = (userId) => localStorage.setItem(key(userId), '1');
