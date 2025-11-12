import "./index.css";

import { StrictMode, Suspense, useEffect, useRef, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation, useRoutes } from "react-router";
import routes from "~react-pages";
import { Spinner } from "@/components/ui";
import { cn } from "@/utils";
import { AuthProvider } from "@/contexts/auth-context";
import { QueryProvider } from "@/contexts/query-provider";

const PageTransitionWrapper = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const node = containerRef.current;

    if (!node) {
      return;
    }

    node.classList.remove("page-transition-active");
    // Force reflow so the animation restarts reliably on every navigation.
    void node.offsetWidth;
    node.classList.add("page-transition-active");
  }, [location.pathname, prefersReducedMotion]);

  const baseClass =
    "page-transition-container gpu-accelerate will-change-transform will-change-opacity";
  const classes = prefersReducedMotion ? baseClass : cn(baseClass, "page-transition-active");

  return (
    <div ref={containerRef} className={classes}>
      {children}
    </div>
  );
};

export const App = () => {
  const element = useRoutes(routes);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFFCF5]">
          <Spinner size="xl" label="Cargando aplicación..." />
        </div>
      }
    >
      <PageTransitionWrapper>{element}</PageTransitionWrapper>
    </Suspense>
  );
};

const app = createRoot(document.getElementById("root")!);

app.render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>,
);
