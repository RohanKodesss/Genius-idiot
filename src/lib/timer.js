// Timer maths, kept pure so it can be tested without a browser.
export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// `state` = { elapsedMs, running, updatedAt }. While running, wall-clock time
// counts, so closing the tab does not pause the timer.
export function elapsedMs(state, now) {
  if (!state) return 0;
  return state.running
    ? state.elapsedMs + Math.max(0, now - state.updatedAt)
    : state.elapsedMs;
}

export const isFinished = (state, now, targetMs) => elapsedMs(state, now) >= targetMs;

export const minutesFrom = (ms) => Math.max(1, Math.round(ms / 60_000));
