import { addDay } from './dates';

// Purely map a static template and explicit runtime values to insertable rows.
export function mapTemplateToRows(template, { goalId, userId, today, createdAt, taskIds }) {
  const goal = {
    id: goalId,
    user_id: userId,
    name: template.title,
    daily_minutes: template.daily_minutes,
    created_at: createdAt,
    updated_at: createdAt,
  };

  const tasks = template.tasks.map((task, index) => ({
    id: taskIds[index],
    goal_id: goalId,
    order: index + 1,
    title: task.title,
    link: task.link?.trim() || null,
    est_minutes: Number(task.est_minutes) || null,
    planned_date: addDay(today, index),
    completed_at: null,
    minutes_spent: null,
    notes: null,
    created_at: createdAt,
    updated_at: createdAt,
  }));

  return { goal, tasks };
}
