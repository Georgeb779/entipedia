import { defineHandler } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb, users, emailVerificationTokens } from "db";
import { sendVerificationEmail } from "../../utils/email";
import { checkRateLimit } from "../../utils/rate-limit.ts";

export default defineHandler(async (event) => {
  const payload = await readBody<{ email?: string }>(event);

  const email = payload?.email?.toLowerCase().trim();

  if (!email) {
    throw new HTTPError("Email is required.", { status: 400 });
  }

  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return {
      success: true,
      message: "Correo de verificación enviado. Por favor, revisa tu bandeja de entrada.",
    };
  }

  if (user.emailVerified) {
    return {
      success: true,
      message: "Tu correo ya está verificado. Puedes iniciar sesión",
    };
  }

  const rateLimit = await checkRateLimit({
    identifier: email,
    scope: "auth:resend-verification",
    limit: 1,
    windowMs: 120_000,
  });

  if (rateLimit.limited) {
    throw new HTTPError("Por favor, espera antes de solicitar otro correo de verificación.", {
      status: 429,
      data: {
        code: "RATE_LIMITED",
        retryAfterMs: rateLimit.retryAfterMs ?? 120_000,
      },
    });
  }

  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  try {
    await sendVerificationEmail(user.email, token, user.name);
  } catch {
    throw new HTTPError("No se pudo enviar el correo de verificación. Intenta nuevamente", {
      status: 500,
    });
  }

  return {
    success: true,
    message: "Correo de verificación enviado. Por favor, revisa tu bandeja de entrada.",
  };
});
