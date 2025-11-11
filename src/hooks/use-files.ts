import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { ApiFile, FileFilters, StoredFile } from "@/types";
import { mapApiFile } from "@/utils";
import { FILE_KEYS } from "./query-keys";
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

const buildQueryString = (filters?: FileFilters) => {
  const params = new URLSearchParams();

  if (filters?.projectId && filters.projectId !== "all") {
    params.set("projectId", String(filters.projectId));
  }

  if (filters?.mimeType && filters.mimeType !== "all") {
    params.set("mimeType", filters.mimeType);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
};

export const useFiles = (filters?: FileFilters): UseQueryResult<StoredFile[]> => {
  const { refreshSession } = useAuthActions();

  return useQuery({
    queryKey: FILE_KEYS.list(filters),
    queryFn: async () => {
      const response = await fetch(`/api/files${buildQueryString(filters)}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      await ensureOk(response, "Failed to fetch files.", () => {
        void refreshSession();
      });

      const data = (await response.json()) as { files: ApiFile[] };
      return data.files.map(mapApiFile);
    },
  });
};

type UploadFileVariables = {
  file: File;
  description: string | null;
  projectId: number | null;
};

export const useUploadFile = (): UseMutationResult<StoredFile, Error, UploadFileVariables> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async ({ file, description, projectId }) => {
      const formData = new FormData();
      formData.append("file", file);

      if (description) {
        formData.append("description", description);
      }

      if (projectId) {
        formData.append("projectId", String(projectId));
      }

      const response = await fetch("/api/files", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      await ensureOk(response, "Failed to upload file.", () => {
        void refreshSession();
      });

      const data = (await response.json()) as { file: ApiFile };
      const mapped = mapApiFile(data.file);

      void queryClient.invalidateQueries({ queryKey: FILE_KEYS.lists() });

      return mapped;
    },
  });
};

export const useDeleteFile = (): UseMutationResult<void, Error, number> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async (fileId) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      await ensureOk(response, "Failed to delete file.", () => {
        void refreshSession();
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FILE_KEYS.lists() });
    },
  });
};

type DownloadFileVariables = {
  fileId: number;
  filename: string;
};

export const useDownloadFile = (): UseMutationResult<void, Error, DownloadFileVariables> => {
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async ({ fileId, filename }) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "GET",
        credentials: "include",
      });

      await ensureOk(response, "Failed to download file.", () => {
        void refreshSession();
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = "none";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
  });
};
