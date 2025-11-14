import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type {
  ApiProject,
  ApiProjectWithTaskCount,
  ApiTask,
  Project,
  ProjectFilters,
  ProjectFormValues,
  ProjectWithTaskCount,
  Task,
} from "@/types";
import { mapApiProject, mapApiProjectWithTaskCount, mapApiTask } from "@/utils";
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

const sortProjects = (projects: ProjectWithTaskCount[], filters?: ProjectFilters) => {
  const sortBy = filters?.sortBy ?? "createdAt";
  const sortOrder = filters?.sortOrder ?? "desc";

  return [...projects].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "taskCount") {
      comparison = a.taskCount - b.taskCount;
    } else {
      comparison = a.createdAt.getTime() - b.createdAt.getTime();
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
};

const filterProjects = (projects: ProjectWithTaskCount[], filters?: ProjectFilters) => {
  const statusFilter = filters?.status ?? "all";
  const priorityFilter = filters?.priority ?? "all";

  return projects.filter((project) => {
    if (statusFilter !== "all" && project.status !== statusFilter) {
      return false;
    }

    if (priorityFilter !== "all" && project.priority !== priorityFilter) {
      return false;
    }

    return true;
  });
};

type UpdateProjectVariables = {
  projectId: string;
  data: Partial<ProjectFormValues>;
};

export const useProjects = (filters?: ProjectFilters): UseQueryResult<ProjectWithTaskCount[]> => {
  const { refreshSession } = useAuthActions();

  return useQuery({
    queryKey: PROJECT_KEYS.list(filters),
    queryFn: async () => {
      const response = await fetch("/api/projects", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      await ensureOk(response, "Failed to fetch projects.", () => {
        void refreshSession();
      });

      const data = (await response.json()) as { projects: ApiProjectWithTaskCount[] };
      const mapped = data.projects.map(mapApiProjectWithTaskCount);
      const filtered = filterProjects(mapped, filters);

      return sortProjects(filtered, filters);
    },
  });
};

type ProjectDetail = {
  project: Project;
  tasks: Task[];
};

export const useProject = (projectId: string): UseQueryResult<ProjectDetail> => {
  const { refreshSession } = useAuthActions();

  return useQuery({
    queryKey: PROJECT_KEYS.detail(projectId),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      await ensureOk(response, "Failed to fetch project.", () => {
        void refreshSession();
      });

      const data = (await response.json()) as { project: ApiProject; tasks: ApiTask[] };

      return {
        project: mapApiProject(data.project),
        tasks: data.tasks.map(mapApiTask),
      };
    },
  });
};

export const useCreateProject = (): UseMutationResult<Project, Error, ProjectFormValues> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description ?? null,
          status: payload.status,
          priority: payload.priority,
        }),
      });

      await ensureOk(response, "Failed to create project.", () => {
        void refreshSession();
      });

      const data = (await response.json()) as { project: ApiProject };
      return mapApiProject(data.project);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
    },
  });
};

export const useUpdateProject = (): UseMutationResult<Project, Error, UpdateProjectVariables> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async ({ projectId, data }) => {
      const requestPayload: Record<string, unknown> = {};

      if (typeof data.name === "string") {
        requestPayload.name = data.name;
      }

      if (Object.prototype.hasOwnProperty.call(data, "description")) {
        requestPayload.description = data.description;
      }

      if (typeof data.status === "string") {
        requestPayload.status = data.status;
      }

      if (typeof data.priority === "string") {
        requestPayload.priority = data.priority;
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      await ensureOk(response, "Failed to update project.", () => {
        void refreshSession();
      });

      const responsePayload = (await response.json()) as { project: ApiProject };
      const mapped = mapApiProject(responsePayload.project);

      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });

      return mapped;
    },
  });
};

export const useDeleteProject = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async (projectId) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      await ensureOk(response, "Failed to delete project.", () => {
        void refreshSession();
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
    },
  });
};
