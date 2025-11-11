import type { TaskPriority, TaskStatus } from "@/types";

/*
Desc:
Purpose: To store reusable constants that can be used across your application.
Why: Avoid hardcoding values (e.g., API URLs, static text, colors, or configuration values) directly in components or functions.
*/

// example:
export const API_BASE_URL = "https://api.your-api.com";
export const STORE_NAME = "Your Store-Name";

export const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-gray-500 text-white",
  in_progress: "bg-blue-500 text-white",
  done: "bg-green-500 text-white",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-gray-400 text-gray-900",
  medium: "bg-yellow-500 text-gray-900",
  high: "bg-red-600 text-white",
};
