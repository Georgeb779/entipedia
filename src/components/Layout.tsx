import { useMemo, useState, type ReactNode } from "react";
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
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/kanban", label: "Kanban", icon: FolderKanban },
  { path: "/files", label: "Files", icon: FileText },
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

  const authenticatedName = auth.status === "authenticated" ? auth.user.name : undefined;
  const userEmail = auth.status === "authenticated" ? auth.user.email : "";

  const initials = useMemo(() => getInitials(authenticatedName), [authenticatedName]);
  const userName = authenticatedName ?? "Guest";

  const isActiveRoute = (path: string) => {
    const currentPath = location.pathname;
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLinkClick = () => {
    closeSidebar();
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      <aside className="border-sidebar-border bg-sidebar text-sidebar-foreground fixed top-0 left-0 z-40 hidden h-screen w-64 border-r md:flex md:flex-col">
        <Link
          to="/dashboard"
          className="border-sidebar-border flex items-center gap-3 border-b px-6 py-5 text-lg font-semibold"
          aria-label="Entipedia dashboard"
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
                  "flex items-center gap-3 rounded-md border-l-4 border-l-transparent px-4 py-2 text-sm font-medium transition-colors",
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
        <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={closeSidebar} />
          <aside className="border-sidebar-border bg-sidebar relative ml-0 flex h-full w-64 flex-col border-r p-4">
            <div className="mb-6 flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-3 text-lg font-semibold">
                <LogoMark size="sm" />
                <span>Entipedia</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSidebar}
                aria-label="Close navigation"
                className="text-muted-foreground hover:text-foreground"
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
                      "flex items-center gap-3 rounded-md border-l-4 border-l-transparent px-4 py-2 text-sm font-medium transition-colors",
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

      <div className="flex min-h-screen w-full flex-col md:ml-64">
        <main className="bg-background flex-1 overflow-y-auto p-6 pt-4">
          <div className="mb-6 flex items-center justify-between md:justify-end">
            <div className="flex items-center gap-3 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Link to="/dashboard" aria-label="Entipedia dashboard">
                <LogoMark size="sm" />
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="border-border text-foreground h-10 w-10 rounded-full border"
                  aria-label="Open profile menu"
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
                  <Link to="/users/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span>Profile</span>
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
                  <span>Logout</span>
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
