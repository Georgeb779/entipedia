import type { User } from "db/schema";

export type ApiAuthUser = Omit<User, "password" | "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = Omit<User, "password">;

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
