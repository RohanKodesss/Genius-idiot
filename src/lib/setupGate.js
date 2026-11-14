// Per-user opt-out from the setup gate ("Set up later").
const key = (userId) => `gi:setup-skipped:${userId}`;

export const hasSkippedSetup = (userId) =>
  Boolean(userId) && localStorage.getItem(key(userId)) === '1';

export const skipSetup = (userId) => localStorage.setItem(key(userId), '1');
