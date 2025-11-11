import { useEffect, type ReactNode } from "react";
import { Outlet, useNavigate } from "react-router";

import { useAuth } from "@/hooks";

interface ProtectedRouteProps {
  children?: ReactNode;
}

/**
 * Protects a route by ensuring the user is authenticated before rendering children.
 * Redirects unauthenticated sessions to the login page and shows a loading state while verifying.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.status === "unauthenticated") {
      navigate("/auth/login", { replace: true });
    }
  }, [auth.status, navigate]);

  if (auth.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Checking session...</p>
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return null;
  }

  return <>{children ?? <Outlet />}</>;
}
