import type { H3Event } from "h3";
import { HTTPError, useSession } from "h3";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const getSession = <T extends Record<string, unknown> = { userId?: string }>(
  event: H3Event,
) => {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new HTTPError("Server configuration error: SESSION_SECRET not set.", { statusCode: 500 });
  }

  return useSession<T>(event, {
    password: sessionSecret,
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  });
};
