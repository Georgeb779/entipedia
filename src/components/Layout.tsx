import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { Link, useLocation } from "react-router";
import {
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button, LogoMark } from "@/components";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useAuth, useAuthActions } from "@/hooks";
import { cn } from "@/utils";

interface LayoutProps {
  children: ReactNode;
}

type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { path: "/tasks", label: "Tareas", icon: CheckSquare },
  { path: "/projects", label: "Proyectos", icon: FolderKanban },
  { path: "/clients", label: "Clientes", icon: Users },
  { path: "/files", label: "Archivos", icon: FileText },
];

const getInitials = (name: string | undefined) => {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const [first, second] = parts;
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
};

/**
 * Provides the primary app shell with sidebar navigation and user profile controls.
 */
export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const auth = useAuth();
  const { logout } = useAuthActions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const bodyOverflowRef = useRef<string | undefined>(undefined);
  const bodyTouchActionRef = useRef<string | undefined>(undefined);

  const authenticatedName = auth.status === "authenticated" ? auth.user.name : undefined;
  const userEmail = auth.status === "authenticated" ? auth.user.email : "";

  const initials = useMemo(() => getInitials(authenticatedName), [authenticatedName]);
  const userName = authenticatedName ?? "Invitado";

  const isActiveRoute = (path: string) => {
    const currentPath = location.pathname;
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
  };

  const closeSidebar = useCallback(() => {
    if (!isSidebarOpen || isAnimating) {
      return;
    }

    setIsAnimating(true);

    animationTimeoutRef.current = window.setTimeout(() => {
      setIsSidebarOpen(false);
      setIsAnimating(false);
      animationTimeoutRef.current = null;
    }, 250);
  }, [isAnimating, isSidebarOpen]);

  const openSidebar = useCallback(() => {
    if (isAnimating) {
      return;
    }

    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    setIsAnimating(false);
    setIsSidebarOpen(true);
  }, [isAnimating]);

  useEffect(
    () => () => {
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current);
      }
    },
    [],
  );

  const handleTouchStart = useCallback((event: ReactTouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  }, []);

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null || isAnimating) {
        return;
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
      }

      event.preventDefault();

      if (deltaX < -50) {
        closeSidebar();
        touchStartXRef.current = null;
        touchStartYRef.current = null;
      }
    },
    [closeSidebar, isAnimating],
  );

  const handleTouchEnd = useCallback(() => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  }, []);

  useEffect(() => {
    const sidebarElement = sidebarRef.current;

    if (!isSidebarOpen || !sidebarElement) {
      if (!isSidebarOpen && previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
        previouslyFocusedElementRef.current = null;
      }

      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(
      sidebarElement.querySelectorAll<HTMLElement>(focusableSelector),
    );
    const focusTarget = focusableElements[0] ?? sidebarElement;
    focusTarget.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const interactiveElements = Array.from(
        sidebarElement.querySelectorAll<HTMLElement>(focusableSelector),
      );

      if (interactiveElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = interactiveElements[0];
      const lastElement = interactiveElements[interactiveElements.length - 1];
      const target = event.target as HTMLElement;

      if (event.shiftKey) {
        if (target === firstElement || !sidebarElement.contains(target)) {
          event.preventDefault();
          (lastElement ?? firstElement).focus();
        }
        return;
      }

      if (target === lastElement) {
        event.preventDefault();
        (firstElement ?? lastElement).focus();
      }
    };

    sidebarElement.addEventListener("keydown", handleKeyDown);

    return () => {
      sidebarElement.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSidebar, isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    bodyOverflowRef.current = document.body.style.overflow;
    bodyTouchActionRef.current = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      if (bodyOverflowRef.current !== undefined) {
        document.body.style.overflow = bodyOverflowRef.current;
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (bodyTouchActionRef.current !== undefined) {
        document.body.style.touchAction = bodyTouchActionRef.current;
      } else {
        document.body.style.removeProperty("touch-action");
      }
    };
  }, [isSidebarOpen]);

  const handleLinkClick = () => {
    if (!isSidebarOpen) {
      return;
    }

    closeSidebar();
  };

  return (
    <div className="bg-background text-foreground flex h-screen overflow-hidden">
      <aside className="border-sidebar-border bg-sidebar text-sidebar-foreground fixed top-0 left-0 z-40 hidden h-screen w-64 border-r md:flex md:flex-col">
        <Link
          to="/dashboard"
          className="border-sidebar-border flex items-center gap-3 border-b px-6 py-5 text-lg font-semibold"
          aria-label="Panel de Entipedia"
        >
          <LogoMark size="sm" />
          <span>Entipedia</span>
        </Link>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md border-l-4 border-l-transparent px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-l-[#E8B90D] bg-[rgba(246,201,14,0.15)] text-[#1C2431]"
                    : "text-muted-foreground hover:bg-[rgba(28,36,49,0.06)] hover:text-[#1C2431]",
                )}
              >
                <Icon
                  className={cn("h-4 w-4", active ? "text-[#1C2431]" : "text-muted-foreground")}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            ref={backdropRef}
            className={cn(
              "absolute inset-0 bg-black/50 backdrop-blur-sm",
              isAnimating ? "animate-backdrop-out pointer-events-none" : "animate-backdrop-in",
            )}
            aria-hidden="true"
            onClick={isAnimating ? undefined : closeSidebar}
          />
          <aside
            ref={sidebarRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navegación móvil"
            tabIndex={-1}
            className={cn(
              "border-sidebar-border bg-sidebar touch-action-pan-y relative z-50 ml-0 flex h-full w-64 flex-col border-r p-4 shadow-xl",
              isAnimating ? "animate-slide-out-left pointer-events-none" : "animate-slide-in-left",
            )}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mb-6 flex items-center justify-between">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 text-lg font-semibold"
                aria-label="Panel de Entipedia"
              >
                <LogoMark size="sm" />
                <span>Entipedia</span>
              </Link>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground h-11 w-11 rounded-full p-0"
                onClick={closeSidebar}
                aria-label="Cerrar navegación"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md border-l-4 border-l-transparent px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "border-l-[#E8B90D] bg-[rgba(246,201,14,0.18)] text-[#1C2431]"
                        : "text-muted-foreground hover:bg-[rgba(28,36,49,0.08)] hover:text-[#1C2431]",
                    )}
                  >
                    <Icon
                      className={cn("h-4 w-4", active ? "text-[#1C2431]" : "text-muted-foreground")}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="flex h-full min-h-0 w-full flex-1 flex-col md:ml-64">
        <main className="bg-background min-h-0 flex-1 overflow-y-auto p-6 pt-4">
          <div className="mb-8 flex min-h-14 items-center justify-between md:justify-end">
            <div className="flex items-center gap-3 md:hidden">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground h-11 w-11 rounded-full p-0"
                onClick={openSidebar}
                aria-label="Abrir navegación"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="border-border text-foreground h-10 w-10 rounded-full border"
                  aria-label="Abrir menú de perfil"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{userName}</p>
                    {userEmail ? (
                      <p className="text-muted-foreground text-xs">{userEmail}</p>
                    ) : null}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/users" className="flex flex-wrap items-center gap-2">
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleLogout();
                  }}
                  className="text-destructive"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
