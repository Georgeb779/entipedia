import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryFilters,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { ApiTask, Task, TaskFilters, TaskFormValues, TaskStatus } from "@/types";
import { mapApiTask } from "@/utils";
import { PROJECT_KEYS, TASK_KEYS } from "./query-keys";
import { useAuthActions } from "./use-auth";

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

    const projectMatches =
      !filters.projectId ||
      filters.projectId === "all" ||
      (task.projectId !== null && task.projectId === filters.projectId);

    return statusMatches && priorityMatches && projectMatches;
  });
};

type CreateTaskVariables = TaskFormValues;

type UpdateTaskVariables = {
  taskId: number;
  data: Partial<TaskFormValues>;
};

const taskListQueryFilters: QueryFilters = {
  predicate: (query) => {
    const queryKey = query.queryKey as readonly unknown[];
    const [scope, type] = queryKey;
    return scope === TASK_KEYS.all[0] && type === TASK_KEYS.lists()[1];
  },
};

export const useTasks = (filters?: TaskFilters): UseQueryResult<Task[]> => {
  const { refreshSession } = useAuthActions();

  return useQuery({
    queryKey: TASK_KEYS.list(filters),
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
      return data.tasks.map(mapApiTask);
    },
    select: (tasks) => applyFilters(tasks, filters),
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
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });

      if (task.projectId) {
        void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(task.projectId) });
      }
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
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });

      if (task.projectId) {
        void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(task.projectId) });
      }
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
      void queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
    },
  });
};

type UpdateTaskStatusVariables = {
  taskId: number;
  status: TaskStatus;
};

/**
 * Mutation hook optimized for Kanban drag-and-drop status changes with optimistic cache updates.
 */
export const useUpdateTaskStatus = (): UseMutationResult<
  Task,
  Error,
  UpdateTaskStatusVariables
> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async ({ taskId, status }) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status }),
      });

      await ensureOk(response, "Failed to update task status.", () => {
        void refreshSession();
      });

      const payload = (await response.json()) as { task: ApiTask };
      return mapApiTask(payload.task);
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries(taskListQueryFilters);

      const previousTasks = queryClient.getQueriesData<Task[]>(taskListQueryFilters);

      queryClient.setQueriesData<Task[]>(taskListQueryFilters, (old) => {
        if (!old) {
          return old;
        }

        return old.map((task) => (task.id === taskId ? { ...task, status } : task));
      });

      return { previousTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });

      if (task.projectId) {
        void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(task.projectId) });
      }
    },
  });
};
