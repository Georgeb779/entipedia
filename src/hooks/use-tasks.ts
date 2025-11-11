import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { ApiTask, Task, TaskFilters, TaskFormValues } from "@/types";
import { mapApiTask } from "@/utils";
import { useAuthActions } from "./use-auth";

const TASK_QUERY_ROOT = ["tasks"] as const;
const TASK_LIST_KEY = [...TASK_QUERY_ROOT, "list"] as const;

const createFiltersKey = (filters?: TaskFilters) =>
  JSON.stringify({
    status: filters?.status ?? "all",
    priority: filters?.priority ?? "all",
  });

const ensureOk = async (response: Response, fallback: string, onUnauthorized?: () => void) => {
  if (response.ok) {
    return;
  }

  if (response.status === 401) {
    onUnauthorized?.();
    throw new Error("Authentication required.");
  }

  const payload = await response.json().catch(() => null);
  const message = (payload as { message?: string } | null)?.message ?? fallback;
  throw new Error(message);
};

const normalizeDueDate = (value: string | null | undefined) =>
  value && value.length > 0 ? value : null;

const applyFilters = (tasks: Task[], filters?: TaskFilters) => {
  if (!filters) {
    return tasks;
  }

  return tasks.filter((task) => {
    const statusMatches =
      !filters.status || filters.status === "all" || task.status === filters.status;

    const priorityMatches =
      !filters.priority || filters.priority === "all" || task.priority === filters.priority;

    return statusMatches && priorityMatches;
  });
};

type CreateTaskVariables = TaskFormValues;

type UpdateTaskVariables = {
  taskId: number;
  data: Partial<TaskFormValues>;
};

export const useTasks = (filters?: TaskFilters): UseQueryResult<Task[]> => {
  const { refreshSession } = useAuthActions();
  const filtersKey = createFiltersKey(filters);

  return useQuery({
    queryKey: [...TASK_LIST_KEY, filtersKey] as const,
    queryFn: async () => {
      const response = await fetch("/api/tasks", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      await ensureOk(response, "Failed to fetch tasks.", () => {
        void refreshSession();
      });

      const data = (await response.json()) as { tasks: ApiTask[] };
      const mappedTasks = data.tasks.map(mapApiTask);

      return applyFilters(mappedTasks, filters);
    },
  });
};

export const useCreateTask = (): UseMutationResult<Task, Error, CreateTaskVariables> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async (variables) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...variables,
          description: variables.description ?? null,
          dueDate: normalizeDueDate(variables.dueDate),
          priority: variables.priority ?? null,
          projectId: variables.projectId ?? null,
        }),
      });

      await ensureOk(response, "Failed to create task.", () => {
        void refreshSession();
      });

      const data = (await response.json()) as { task: ApiTask };
      return mapApiTask(data.task);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASK_LIST_KEY });
    },
  });
};

export const useUpdateTask = (): UseMutationResult<Task, Error, UpdateTaskVariables> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async ({ taskId, data }) => {
      const body: Record<string, unknown> = {};

      if (data.title !== undefined) {
        body.title = data.title;
      }

      if (data.description !== undefined) {
        body.description = data.description;
      }

      if (data.status !== undefined) {
        body.status = data.status;
      }

      if (data.priority !== undefined) {
        body.priority = data.priority;
      }

      if (data.dueDate !== undefined) {
        body.dueDate = normalizeDueDate(data.dueDate);
      }

      if (data.projectId !== undefined) {
        body.projectId = data.projectId;
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      await ensureOk(response, "Failed to update task.", () => {
        void refreshSession();
      });

      const payload = (await response.json()) as { task: ApiTask };
      return mapApiTask(payload.task);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASK_LIST_KEY });
    },
  });
};

export const useDeleteTask = (): UseMutationResult<void, Error, number> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async (taskId) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      await ensureOk(response, "Failed to delete task.", () => {
        void refreshSession();
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASK_LIST_KEY });
    },
  });
};
