/**
 * Utilities for working with task data on the client.
 */
import type { ApiTask, Task } from "@/types";

const parseDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

/**
 * Maps an API task payload (with ISO date strings) into the frontend Task type.
 */
export const mapApiTask = (task: ApiTask): Task => ({
  ...task,
  dueDate: task.dueDate ? parseDate(task.dueDate) : null,
  createdAt: parseDate(task.createdAt),
  updatedAt: parseDate(task.updatedAt),
});

const displayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const displayDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Formats a task date for display within the UI.
 */
export const formatTaskDate = (value: Date | string | null): string => {
  if (!value) {
    return "No due date";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return displayFormatter.format(date);
};

/**
 * Formats a date with time information for activity or audit displays.
 */
export const formatTaskDateTime = (value: Date | string | null): string => {
  if (!value) {
    return "Unknown date";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return displayDateTimeFormatter.format(date);
};

/**
 * Formats a task date for use in date input controls.
 */
export const formatDateForInput = (value: Date | string | null): string => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0] ?? "";
};
