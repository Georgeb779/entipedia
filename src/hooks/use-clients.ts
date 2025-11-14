import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { ApiClient, Client, ClientFilters, ClientFormValues } from "@/types";
import { mapApiClient } from "@/utils";
import { CLIENT_KEYS } from "./query-keys";
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

type ClientsResult = {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const buildQueryString = (filters?: ClientFilters) => {
  const params = new URLSearchParams();

  if (filters?.page) {
    params.set("page", String(filters.page));
  }

  if (filters?.limit) {
    params.set("limit", String(filters.limit));
  }

  if (filters?.type && filters.type !== "all") {
    params.set("type", filters.type);
  }

  if (filters?.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  if (filters?.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
};

export const useClients = (filters?: ClientFilters): UseQueryResult<ClientsResult> => {
  const { refreshSession } = useAuthActions();

  return useQuery({
    queryKey: CLIENT_KEYS.list(filters),
    queryFn: async () => {
      const response = await fetch(`/api/clients${buildQueryString(filters)}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      await ensureOk(response, "Failed to fetch clients.", () => {
        void refreshSession();
      });

      const data = (await response.json()) as {
        clients: ApiClient[];
        pagination: ClientsResult["pagination"];
      };

      return {
        clients: data.clients.map(mapApiClient),
        pagination: data.pagination,
      };
    },
  });
};

type CreateClientVariables = ClientFormValues;

export const useCreateClient = (): UseMutationResult<Client, Error, CreateClientVariables> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: payload.name,
          type: payload.type,
          value: payload.value,
          startDate: payload.startDate,
          endDate: payload.endDate,
        }),
      });

      await ensureOk(response, "Failed to create client.", () => {
        void refreshSession();
      });

      const data = (await response.json()) as { client: ApiClient };
      return mapApiClient(data.client);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.lists() });
    },
  });
};

type UpdateClientVariables = {
  clientId: string;
  data: Partial<ClientFormValues>;
};

export const useUpdateClient = (): UseMutationResult<Client, Error, UpdateClientVariables> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async ({ clientId, data }) => {
      const payload: Record<string, unknown> = {};

      if (data.name !== undefined) {
        payload.name = data.name;
      }

      if (data.type !== undefined) {
        payload.type = data.type;
      }

      if (data.value !== undefined) {
        payload.value = data.value;
      }

      if (data.startDate !== undefined) {
        payload.startDate = data.startDate;
      }

      if (data.endDate !== undefined) {
        payload.endDate = data.endDate;
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      await ensureOk(response, "Failed to update client.", () => {
        void refreshSession();
      });

      const json = (await response.json()) as { client: ApiClient };
      const mapped = mapApiClient(json.client);

      void queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.detail(clientId) });

      return mapped;
    },
  });
};

export const useDeleteClient = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuthActions();

  return useMutation({
    mutationFn: async (clientId) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      await ensureOk(response, "Failed to delete client.", () => {
        void refreshSession();
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.lists() });
    },
  });
};
