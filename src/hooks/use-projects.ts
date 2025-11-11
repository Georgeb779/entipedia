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
import { useAuthActions } from "./use-auth";

const serializeFilters = (filters?: ProjectFilters) =>
  JSON.stringify({
    sortBy: filters?.sortBy ?? "createdAt",
    sortOrder: filters?.sortOrder ?? "desc",
  });

const PROJECT_KEYS = {
  all: ["projects"] as const,
  lists: () => [...PROJECT_KEYS.all, "list"] as const,
  list: (filters?: ProjectFilters) => [...PROJECT_KEYS.lists(), serializeFilters(filters)] as const,
  details: () => [...PROJECT_KEYS.all, "detail"] as const,
  detail: (id: number) => [...PROJECT_KEYS.details(), id] as const,
} as const;

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

type UpdateProjectVariables = {
  projectId: number;
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

      return sortProjects(mapped, filters);
    },
  });
};

type ProjectDetail = {
  project: Project;
  tasks: Task[];
};

export const useProject = (projectId: number): UseQueryResult<ProjectDetail> => {
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
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description ?? null,
        }),
      });

      await ensureOk(response, "Failed to update project.", () => {
        void refreshSession();
      });

      const payload = (await response.json()) as { project: ApiProject };
      const mapped = mapApiProject(payload.project);

      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });

      return mapped;
    },
  });
};

export const useDeleteProject = (): UseMutationResult<void, Error, number> => {
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
    },
  });
};
