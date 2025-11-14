import type { Task } from "@/types";
import { formatTaskDate } from "@/utils";

export const TASK_PROJECT_BADGE_CLASS = "bg-blue-100 text-blue-700";
export const TASK_PROJECT_BADGE_FALLBACK_CLASS = "bg-neutral-200 text-neutral-700";
export const TASK_PROJECT_NAME_FALLBACK = "Proyecto sin título";

export function getTaskDueDateInfo(value: Task["dueDate"]) {
  if (!value) {
    return { label: "Sin fecha", toneClass: "text-neutral-500" };
  }

  const dueDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(dueDate.getTime())) {
    return { label: "Sin fecha", toneClass: "text-neutral-500" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedDueDate = new Date(dueDate);
  normalizedDueDate.setHours(0, 0, 0, 0);

  const diff = normalizedDueDate.getTime() - today.getTime();
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
  const formatted = formatTaskDate(dueDate);

  if (diff < 0) {
    return { label: formatted, toneClass: "text-red-600" };
  }

  if (diff <= threeDaysInMs) {
    return { label: formatted, toneClass: "text-yellow-600" };
  }

  return { label: formatted, toneClass: "text-neutral-700" };
}
