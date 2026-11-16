// localStorage implementation of the repository contract (DEMO_MODE).
// Same shape as lib/repository.js: every function returns { ok, data } or
// { ok: false, status, code, message, retryable }.
import { addDay, todayOf } from './dates';

const KEY = 'gi:data';
export const DEMO_USER = { id: 'demo-user', email: 'demo@genius-idiot.local' };
let memoryStore = null;
let storageUnavailable = false;

const uuid = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2)}`;

const ok = (data) => ({ ok: true, data });
const fail = (message) => ({ ok: false, status: 400, code: null, message, retryable: false });

function read() {
  if (storageUnavailable) return memoryStore;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (stored) memoryStore = stored;
    return stored ?? memoryStore;
  } catch {
    storageUnavailable = true;
    return memoryStore;
  }
}

function write(data) {
  memoryStore = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    storageUnavailable = false;
  } catch {
    storageUnavailable = true;
    // Keep demo mode usable for this session when storage is blocked or full.
  }
  return data;
}

// Seeded demo data: three goals, 10 tasks each, staggered completions so one
// goal is visibly behind (the money demo) and two have streaks.
function seed() {
  const now = new Date().toISOString();
  const today = todayOf(new Date());
  const make = (name, dailyMinutes) => ({
    id: uuid(),
    user_id: DEMO_USER.id,
    name,
    daily_minutes: dailyMinutes,
    created_at: now,
    updated_at: now,
  });

  const goals = [
    make('DSA', 60),
    make('Web Development', 70),
    make('Content Writing', 50),
  ];
  const titles = {
    DSA: ['Arrays basics', 'Two pointers', 'Sliding window', 'Binary search', 'Recursion', 'Linked lists', 'Stacks & queues', 'Trees', 'Graphs', 'DP intro'],
    'Web Development': ['HTML semantics', 'Flexbox', 'Grid', 'Responsive layout', 'JS basics', 'DOM events', 'Fetch & async', 'Components', 'State', 'Deploy'],
    'Content Writing': ['Headlines', 'Outlines', 'Draft 300 words', 'Edit pass', 'SEO basics', 'Voice & tone', 'Long form', 'Newsletter', 'Landing copy', 'Portfolio'],
  };
  const completedCount = { DSA: 4, 'Web Development': 9, 'Content Writing': 8 };

  const tasks = [];
  goals.forEach((goal) => {
    titles[goal.name].forEach((title, index) => {
      const planned = addDay(today, index - 9);
      const done = index < completedCount[goal.name];
      tasks.push({
        id: uuid(),
        goal_id: goal.id,
        order: index + 1,
        title,
        link: index % 3 === 0 ? 'https://example.com/resource' : null,
        est_minutes: index % 4 === 0 ? 45 : null,
        planned_date: planned,
        completed_at: done ? new Date(`${planned}T19:00:00`).toISOString() : null,
        minutes_spent: done ? 40 : null,
        notes: index === 0 ? 'Start here — write what you learn as you go.' : null,
        created_at: now,
        updated_at: now,
      });
    });
  });

  return { goals, tasks, restDays: [] };
}

function data() {
  return read() ?? write(seed());
}

export async function fetchAll() {
  const store = data();
  return ok({
    goals: [...store.goals].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    tasks: [...store.tasks].sort((a, b) => a.order - b.order),
    restDays: [...store.restDays],
  });
}

export async function getGoal(goalId) {
  const goal = data().goals.find((g) => g.id === goalId);
  return goal ? ok(goal) : fail('Goal not found.');
}

export async function getTasksForGoal(goalId) {
  return ok(data().tasks.filter((task) => task.goal_id === goalId));
}

export async function getRestDaysForGoal(goalId) {
  return ok(data().restDays.filter((restDay) => restDay.goal_id === goalId));
}

export async function createGoal(goal) {
  const store = data();
  if (store.goals.some((g) => g.name === goal.name)) {
    return { ok: false, status: 409, code: '23505', message: 'Duplicate goal name.', retryable: false };
  }
  write({ ...store, goals: [...store.goals, goal] });
  return ok(goal);
}

export async function updateGoal(goalId, patch) {
  const store = data();
  const goals = store.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal));
  write({ ...store, goals });
  return ok(goals.find((goal) => goal.id === goalId) ?? null);
}

export async function deleteGoal(goalId) {
  const store = data();
  write({
    goals: store.goals.filter((goal) => goal.id !== goalId),
    tasks: store.tasks.filter((task) => task.goal_id !== goalId),
    restDays: store.restDays.filter((restDay) => restDay.goal_id !== goalId),
  });
  return ok(null);
}

export async function createTask(task) {
  const store = data();
  write({ ...store, tasks: [...store.tasks, task] });
  return ok(task);
}

export async function importTasks(tasks) {
  const store = data();
  write({ ...store, tasks: [...store.tasks, ...tasks] });
  return ok(tasks);
}

export async function updateTask(taskId, patch) {
  const store = data();
  const tasks = store.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task));
  write({ ...store, tasks });
  return ok(tasks.find((task) => task.id === taskId) ?? null);
}

export async function completeTask(taskId, at, minutes) {
  return updateTask(taskId, {
    completed_at: at,
    minutes_spent: minutes ?? null,
    updated_at: at,
  });
}

export async function undoTask(taskId) {
  return updateTask(taskId, { completed_at: null, minutes_spent: null });
}

export async function deleteTask(taskId) {
  const store = data();
  write({ ...store, tasks: store.tasks.filter((task) => task.id !== taskId) });
  return ok(null);
}

export async function reorderTask(taskId, newOrder) {
  const store = data();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return fail('Task not found.');

  const queue = store.tasks
    .filter((t) => t.goal_id === task.goal_id)
    .sort((a, b) => a.order - b.order);
  const from = queue.findIndex((t) => t.id === taskId);
  const to = Math.min(Math.max(newOrder - 1, 0), queue.length - 1);
  queue.splice(to, 0, ...queue.splice(from, 1));
  const renumbered = queue.map((t, index) => ({ ...t, order: index + 1 }));

  write({
    ...store,
    tasks: store.tasks.map((t) => renumbered.find((r) => r.id === t.id) ?? t),
  });
  return ok(null);
}

export async function markRestDay(goalId, date) {
  const store = data();
  if (store.restDays.some((r) => r.goal_id === goalId && r.date === date)) return ok(null);
  const restDay = { id: uuid(), goal_id: goalId, date, created_at: new Date().toISOString() };
  write({ ...store, restDays: [...store.restDays, restDay] });
  return ok(restDay);
}

export async function unmarkRestDay(goalId, date) {
  const store = data();
  write({
    ...store,
    restDays: store.restDays.filter((r) => !(r.goal_id === goalId && r.date === date)),
  });
  return ok(null);
}

// Auth is a no-op in demo mode: there is no account to protect.
export async function signUp() {
  return ok(DEMO_USER);
}

export async function logIn() {
  return ok(DEMO_USER);
}

export async function resendConfirmation() {
  return ok(null);
}

export async function requestPasswordReset() {
  return ok(null);
}

export async function completePasswordRecovery() {
  return getCurrentUser();
}

export async function updatePassword() {
  return ok(DEMO_USER);
}

export async function logOut() {
  return ok(null);
}

export async function getCurrentUser() {
  return ok(DEMO_USER);
}

export function onAuthChange() {
  return () => {};
}

export function resetDemoData() {
  memoryStore = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // The next read will reseed an in-memory demo workspace.
  }
}
