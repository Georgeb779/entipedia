import { defineHandler } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { eq } from "drizzle-orm";

import { getDb, users, emailVerificationTokens } from "db";
import { getSession } from "../../utils/session";
import { verifyPassword } from "../../utils/password";

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const shouldSkipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === "true";

export default defineHandler(async (event) => {
  const payload = await readBody<{ email?: string; password?: string }>(event);

  const email = payload?.email?.toLowerCase().trim();
  const password = payload?.password;

  if (!email || !password) {
    throw new HTTPError("Email and password are required.", { status: 400 });
  }

  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    throw new HTTPError("Invalid email or password.", { status: 401 });
  }

  let passwordMatches = false;

  try {
    passwordMatches = await verifyPassword(password, user.password);
  } catch {
    throw new HTTPError("Failed to verify credentials.", { status: 500 });
  }

  if (!passwordMatches) {
    throw new HTTPError("Invalid email or password.", { status: 401 });
  }

  let activeUser = user;

  if (!user.emailVerified) {
    if (shouldSkipEmailVerification) {
      const now = new Date();

      await db
        .update(users)
        .set({ emailVerified: true, emailVerifiedAt: now })
        .where(eq(users.id, user.id));

      await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));

      activeUser = { ...user, emailVerified: true, emailVerifiedAt: now, updatedAt: now };
    } else {
      return new Response(
        JSON.stringify({
          code: "EMAIL_NOT_VERIFIED",
          message:
            "Tu correo electrónico no ha sido verificado. Por favor, revisa tu bandeja de entrada.",
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        },
      );
    }
  }

  const session = await getSession(event);

  await session.update({ userId: user.id });

  return {
    user: {
      id: activeUser.id,
      email: activeUser.email,
      name: activeUser.name,
      createdAt: toIsoString(activeUser.createdAt),
      updatedAt: toIsoString(activeUser.updatedAt),
    },
  };
});
