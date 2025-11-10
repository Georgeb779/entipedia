import type { ApiAuthUser, AuthUser } from "@/types";

const parseDate = (value: string) => new Date(value);

export const mapApiAuthUser = (user: ApiAuthUser): AuthUser => ({
  ...user,
  createdAt: parseDate(user.createdAt),
  updatedAt: parseDate(user.updatedAt),
});
