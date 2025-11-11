import type { ClientFilters, ProjectFilters, TaskFilters } from "@/types";

type ProjectFiltersKey = string;
type TaskFiltersKey = string;
type ClientFiltersKey = string;

const createProjectFiltersKey = (filters?: ProjectFilters): ProjectFiltersKey =>
  JSON.stringify({
    sortBy: filters?.sortBy ?? "createdAt",
    sortOrder: filters?.sortOrder ?? "desc",
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

export { createProjectFiltersKey, createTaskFiltersKey, createClientFiltersKey };
