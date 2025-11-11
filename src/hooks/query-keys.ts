import type { ClientFilters, FileFilters, ProjectFilters, TaskFilters } from "@/types";

type ProjectFiltersKey = string;
type TaskFiltersKey = string;
type ClientFiltersKey = string;
type FileFiltersKey = string;

const createProjectFiltersKey = (filters?: ProjectFilters): ProjectFiltersKey =>
  JSON.stringify({
    sortBy: filters?.sortBy ?? "createdAt",
    sortOrder: filters?.sortOrder ?? "desc",
    status: filters?.status ?? "all",
    priority: filters?.priority ?? "all",
  });

const createTaskFiltersKey = (filters?: TaskFilters): TaskFiltersKey =>
  JSON.stringify({
    status: filters?.status ?? "all",
    priority: filters?.priority ?? "all",
    projectId: filters?.projectId ?? "all",
  });

const createClientFiltersKey = (filters?: ClientFilters): ClientFiltersKey =>
  JSON.stringify({
    type: filters?.type ?? "all",
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 10,
    sortBy: filters?.sortBy ?? "createdAt",
    sortOrder: filters?.sortOrder ?? "desc",
  });

const createFileFiltersKey = (filters?: FileFilters): FileFiltersKey =>
  JSON.stringify({
    projectId: filters?.projectId ?? "all",
    mimeType: filters?.mimeType ?? "all",
  });

export const PROJECT_KEYS = {
  all: ["projects"],
  lists: () => [...PROJECT_KEYS.all, "list"],
  list: (filters?: ProjectFilters) => [...PROJECT_KEYS.lists(), createProjectFiltersKey(filters)],
  details: () => [...PROJECT_KEYS.all, "detail"],
  detail: (id: number) => [...PROJECT_KEYS.details(), id],
};

export const TASK_KEYS = {
  all: ["tasks"],
  lists: () => [...TASK_KEYS.all, "list"],
  list: (filters?: TaskFilters) => [...TASK_KEYS.lists(), createTaskFiltersKey(filters)],
};

export const CLIENT_KEYS = {
  all: ["clients"],
  lists: () => [...CLIENT_KEYS.all, "list"],
  list: (filters?: ClientFilters) => [...CLIENT_KEYS.lists(), createClientFiltersKey(filters)],
  details: () => [...CLIENT_KEYS.all, "detail"],
  detail: (id: number) => [...CLIENT_KEYS.details(), id],
};

export const FILE_KEYS = {
  all: ["files"],
  lists: () => [...FILE_KEYS.all, "list"],
  list: (filters?: FileFilters) => [...FILE_KEYS.lists(), createFileFiltersKey(filters)],
  details: () => [...FILE_KEYS.all, "detail"],
  detail: (id: number) => [...FILE_KEYS.details(), id],
};

export {
  createProjectFiltersKey,
  createTaskFiltersKey,
  createClientFiltersKey,
  createFileFiltersKey,
};
