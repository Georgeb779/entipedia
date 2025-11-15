import { type ReactNode, useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth, useAuthActions } from "@/hooks";

interface ProtectedRouteProps {
  children?: ReactNode;
}

/**
 * Protects a route by ensuring the user is authenticated before rendering children.
 * Redirects unauthenticated sessions to the login page and shows a loading state while verifying.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();
  const location = useLocation();
  const { refreshSession } = useAuthActions();

  const redirectTarget = `${location.pathname}${location.search}${location.hash}`;
  const lastVerifiedLocationRef = useRef<string | null>(null);

  useEffect(() => {
    if (auth.status !== "authenticated") {
      lastVerifiedLocationRef.current = null;
      return;
    }

    const locationKey = redirectTarget;

    if (lastVerifiedLocationRef.current === locationKey) {
      return;
    }

    if (lastVerifiedLocationRef.current === null) {
      lastVerifiedLocationRef.current = locationKey;
      return;
    }

    lastVerifiedLocationRef.current = locationKey;
    void refreshSession();
  }, [auth.status, redirectTarget, refreshSession]);

  if (auth.status === "loading") {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Checking session...</p>
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    const redirectState =
      auth.reason === "expired"
        ? {
            from: redirectTarget,
            message: "Tu sesión expiró. Vuelve a iniciar sesión.",
          }
        : { from: redirectTarget };

    return <Navigate to="/auth/login" replace state={redirectState} />;
  }

  return <>{children ?? <Outlet />}</>;
}
