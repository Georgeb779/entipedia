import { startTransition, useCallback, useEffect, useMemo, useState } from "react";

import { AuthActionsContext, AuthStateContext } from "@/contexts/auth-context.shared";
import type { ApiAuthUser, AuthActions, AuthState, AuthUser } from "@/types";
import { mapApiAuthUser } from "@/utils";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data: { user: ApiAuthUser } = await response.json();
        const authUser = mapApiAuthUser(data.user);
        startTransition(() => {
          setState({ status: "authenticated", user: authUser });
        });
        return;
      }

      if (response.status === 401) {
        startTransition(() => {
          setState({ status: "unauthenticated" });
        });
        return;
      }
    } catch {
      startTransition(() => {
        setState({ status: "unauthenticated" });
      });
      return;
    }

    startTransition(() => {
      setState({ status: "unauthenticated" });
    });
  }, []);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const login = useCallback((user: AuthUser) => {
    startTransition(() => {
      setState({ status: "authenticated", user });
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      startTransition(() => {
        setState({ status: "unauthenticated" });
      });
    }
  }, []);

  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  const actions = useMemo<AuthActions>(
    () => ({
      login,
      logout,
      refreshSession,
    }),
    [login, logout, refreshSession],
  );

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionsContext.Provider value={actions}>{children}</AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
};
