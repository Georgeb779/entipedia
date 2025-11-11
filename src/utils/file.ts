/**
 * Utility helpers for working with file metadata in the client and server.
 */
import {
  ALLOWED_FILE_TYPES,
  FILE_CATEGORY_ICONS,
  FILE_TYPE_CATEGORIES,
  MAX_FILE_SIZE,
} from "@/constants";
import type { ApiFile, FileCategory, StoredFile } from "@/types";

const parseDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

/**
 * Maps an API file payload into the strongly typed StoredFile shape.
 */
export const mapApiFile = (file: ApiFile): StoredFile => ({
  ...file,
  createdAt: parseDate(file.createdAt),
});

const displayDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatFileDate = (value: Date | string | null): string => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return displayDateFormatter.format(date);
};

/**
 * Formats a raw byte size into a human readable string.
 */
export const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  const megabytes = kilobytes / 1024;

  if (megabytes < 1024) {
    return `${megabytes.toFixed(1)} MB`;
  }

  const gigabytes = megabytes / 1024;
  return `${gigabytes.toFixed(1)} GB`;
};

/**
 * Determines the high-level category for a given MIME type.
 */
export const getFileCategory = (mimeType: string): FileCategory => {
  return FILE_TYPE_CATEGORIES[mimeType] ?? "other";
};

export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === filename.length - 1) {
    return "";
  }

  return filename.slice(lastDotIndex).toLowerCase();
};

export const getFileCategoryIcon = (category: FileCategory) => {
  return FILE_CATEGORY_ICONS[category];
};

/**
 * Performs a client-side validation against the MIME type whitelist.
 */
export const validateFileType = (file: File): boolean => {
  return ALLOWED_FILE_TYPES.includes(file.type);
};

/**
 * Ensures a file does not exceed the configured size limit.
 */
export const validateFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

const sanitizeFilename = (filename: string) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
};

/**
 * Generates a unique filename while preserving the original extension.
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  const trimmed = originalFilename.trim() || "file";
  const lastDotIndex = trimmed.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < trimmed.length - 1;
  const baseName = hasExtension ? trimmed.slice(0, lastDotIndex) : trimmed;
  const extension = hasExtension ? trimmed.slice(lastDotIndex) : "";
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const sanitizedBase = sanitizeFilename(baseName) || "file";

  return `${uniquePrefix}-${sanitizedBase}${extension}`;
};
