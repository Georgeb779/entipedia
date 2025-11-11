import type { ProjectFilters, TaskFilters } from "@/types";

type ProjectFiltersKey = string;
type TaskFiltersKey = string;

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

export const PROJECT_KEYS = {
  all: ["projects"] as const,
  lists: () => [...PROJECT_KEYS.all, "list"] as const,
  list: (filters?: ProjectFilters) =>
    [...PROJECT_KEYS.lists(), createProjectFiltersKey(filters)] as const,
  details: () => [...PROJECT_KEYS.all, "detail"] as const,
  detail: (id: number) => [...PROJECT_KEYS.details(), id] as const,
} as const;

export const TASK_KEYS = {
  all: ["tasks"] as const,
  lists: () => [...TASK_KEYS.all, "list"] as const,
  list: (filters?: TaskFilters) => [...TASK_KEYS.lists(), createTaskFiltersKey(filters)] as const,
} as const;

export { createProjectFiltersKey, createTaskFiltersKey };
