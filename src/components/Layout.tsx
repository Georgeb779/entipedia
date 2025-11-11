import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import {
  CheckSquare,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
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
  { path: "/kanban", label: "Kanban", icon: LayoutDashboard },
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
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-64 border-r border-gray-700 bg-gray-800 md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-gray-700 px-6 py-5 text-lg font-semibold">
          <Home className="h-5 w-5" aria-hidden="true" />
          <span>Entipedia</span>
        </div>
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={closeSidebar} />
          <aside className="relative ml-0 flex h-full w-64 flex-col border-r border-gray-700 bg-gray-800 p-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Home className="h-5 w-5" aria-hidden="true" />
                <span>Entipedia</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSidebar}
                aria-label="Close navigation"
                className="text-gray-300 hover:text-white"
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
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:bg-gray-700 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen w-full flex-col md:ml-64">
        <header className="sticky top-0 z-30 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex flex-1 items-center gap-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-300 hover:text-white md:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
                <span className="text-lg font-semibold text-white md:hidden">Entipedia</span>
                <Link
                  to="/dashboard"
                  className="hidden items-center gap-2 text-lg font-semibold text-white transition-colors hover:text-gray-200 md:flex"
                  aria-label="Entipedia dashboard"
                >
                  <Home className="h-5 w-5" aria-hidden="true" />
                  <span>Entipedia</span>
                </Link>
              </div>

              <NavigationMenu className="hidden md:flex">
                <NavigationMenuList>
                  {navItems.map((item) => {
                    const active = isActiveRoute(item.path);

                    return (
                      <NavigationMenuItem key={item.path}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.path}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              active
                                ? "bg-gray-700 text-white"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white",
                            )}
                          >
                            {item.label}
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-gray-700 text-white"
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
                    <p className="text-sm font-medium text-white">{userName}</p>
                    {userEmail ? <p className="text-xs text-gray-400">{userEmail}</p> : null}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/users/profile" className="flex items-center gap-2 text-gray-200">
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
                  className="text-red-300"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1">
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
        </main>
      </div>
    </div>
  );
}
