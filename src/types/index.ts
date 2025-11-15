import type {
  User,
  Task as DbTask,
  NewTask as DbNewTask,
  Project as DbProject,
  NewProject as DbNewProject,
  File as DbFile,
  NewFile as DbNewFile,
  Client as DbClient,
  NewClient as DbNewClient,
} from "db/schema";

export type ApiAuthUser = Omit<User, "password" | "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = Omit<User, "password">;

export type Task = DbTask;
export type NewTask = DbNewTask;

export type Project = DbProject;
export type NewProject = DbNewProject;

export type StoredFile = DbFile;
export type NewStoredFile = DbNewFile;

export type Client = DbClient;
export type NewClient = DbNewClient;

export type ClientType = "person" | "company";

export type ApiClient = Omit<Client, "startDate" | "endDate" | "createdAt" | "updatedAt"> & {
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientFormValues = {
  name: string;
  type: ClientType;
  value: number;
  startDate: string;
  endDate: string | null;
};

export type ClientFilters = {
  type?: ClientType | "all";
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "value";
  sortOrder?: "asc" | "desc";
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type ProjectStatus = "todo" | "in_progress" | "done";
export type ProjectPriority = "low" | "medium" | "high";

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
  projectId: string | null;
};

export type TaskFilters = {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  projectId?: string | "all";
};

export type ApiProject = Omit<Project, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type ProjectWithTaskCount = Project & {
  taskCount: number;
  completedTaskCount: number;
};

export type ApiProjectWithTaskCount = Omit<ProjectWithTaskCount, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type ProjectFormValues = {
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
};

export type ProjectFilters = {
  sortBy?: "name" | "createdAt" | "taskCount";
  sortOrder?: "asc" | "desc";
  status?: ProjectStatus | "all";
  priority?: ProjectPriority | "all";
};

export type ApiFile = Omit<StoredFile, "createdAt"> & {
  createdAt: string;
};

export type FileFormValues = {
  file: File;
  projectId: string | null;
  description: string | null;
};

export type FileFilters = {
  projectId?: string | "all";
  mimeType?: string | "all";
};

export type FileUploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

export type FileCategory = "image" | "document" | "video" | "audio" | "archive" | "other";

export type AuthUnauthenticatedReason = "logout" | "expired" | "unauthorized" | "error";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated"; reason?: AuthUnauthenticatedReason }
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
