import type { ClientType, FileCategory, TaskPriority, TaskStatus } from "@/types";

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
  todo: "bg-[rgba(28,36,49,0.08)] text-[#1C2431]",
  in_progress: "bg-[rgba(246,201,14,0.2)] text-[#1C2431]",
  done: "bg-[#E1F3EA] text-[#1C2431]",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-[#F0EFEA] text-[#1F1F1F]",
  medium: "bg-[rgba(246,201,14,0.18)] text-[#1C2431]",
  high: "bg-[#FDE6E6] text-[#A61B1B]",
};

// Maximum upload size limit (10 MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_FILE_TYPES: readonly string[] = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  // Other
  "application/json",
  "text/html",
  "text/css",
  "text/javascript",
];

export const FILE_TYPE_CATEGORIES: Record<string, FileCategory> = {
  // Images
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/svg+xml": "image",
  // Documents
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "application/vnd.ms-powerpoint": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
  "text/plain": "document",
  "text/csv": "document",
  "application/json": "document",
  "text/html": "document",
  "text/css": "document",
  "text/javascript": "document",
  // Archives
  "application/zip": "archive",
  "application/x-rar-compressed": "archive",
  "application/x-7z-compressed": "archive",
  // Audio
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  // Video
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
};

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  image: "Image",
  document: "Document",
  video: "Video",
  audio: "Audio",
  archive: "Archive",
  other: "Other",
};

export const FILE_CATEGORY_ICONS: Record<FileCategory, string> = {
  image: "Image",
  document: "FileText",
  video: "Video",
  audio: "Music",
  archive: "Archive",
  other: "File",
};

export const CLIENT_TYPE_OPTIONS: Array<{ value: ClientType; label: string }> = [
  { value: "person", label: "Person" },
  { value: "company", label: "Company" },
];

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  person: "Person",
  company: "Company",
};

export const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  person: "bg-[#E8EFFC] text-[#1C2431]",
  company: "bg-[#F0EFEA] text-[#1F1F1F]",
};
