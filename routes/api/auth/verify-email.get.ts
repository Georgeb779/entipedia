import { defineHandler, getQuery } from "nitro/h3";
import { HTTPError } from "h3";
import { eq } from "drizzle-orm";

import { getDb, users, emailVerificationTokens } from "db";

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const tokenParam = Array.isArray(query.token) ? query.token[0] : query.token;
  const token = typeof tokenParam === "string" ? tokenParam.trim() : undefined;

  if (!token || token.length === 0) {
    throw new HTTPError("Verification token is required.", { status: 400 });
  }

  const db = getDb();

  const [tokenRecord] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);

  if (!tokenRecord) {
    throw new HTTPError("Invalid or expired verification token.", { status: 404 });
  }

  const now = new Date();
  if (tokenRecord.expiresAt < now) {
    throw new HTTPError(
      "Verification token has expired. Please request a new verification email.",
      {
        status: 410,
      },
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, tokenRecord.userId)).limit(1);

  if (!user) {
    throw new HTTPError("User not found.", { status: 404 });
  }

  if (user.emailVerified) {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, tokenRecord.id));
    return {
      success: true,
      message: "Email already verified. You can now log in.",
    };
  }

  try {
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerifiedAt: now,
      })
      .where(eq(users.id, user.id));

    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, tokenRecord.id));
  } catch (error) {
    console.error("Failed to verify email:", error);
    throw new HTTPError("Failed to verify email. Please try again.", { status: 500 });
  }

  return {
    success: true,
    message: "Email verified successfully. You can now log in.",
  };
});
