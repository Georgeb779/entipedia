import type { User, Task as DbTask, NewTask as DbNewTask } from "db/schema";

export type ApiAuthUser = Omit<User, "password" | "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = Omit<User, "password">;

export type Task = DbTask;
export type NewTask = DbNewTask;

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type ApiTask = Omit<Task, "dueDate" | "createdAt" | "updatedAt"> & {
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskFormValues = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  dueDate: string | null;
  projectId: number | null;
};

export type TaskFilters = {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
};

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: AuthUser };

export type AuthActions = {
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  name: string;
};
