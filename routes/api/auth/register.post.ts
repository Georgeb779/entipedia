import { defineHandler } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb, users, emailVerificationTokens } from "db";
import { hashPassword } from "../../utils/password";
import { sendVerificationEmail } from "../../utils/email";

export default defineHandler(async (event) => {
  const payload = await readBody<{
    email?: string;
    password?: string;
    name?: string;
  }>(event);

  const email = payload?.email?.toLowerCase().trim();
  const password = payload?.password;
  const name = payload?.name?.trim();

  if (!email || !password || !name) {
    throw new HTTPError("Email, password, and name are required.", { status: 400 });
  }

  if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
    throw new HTTPError("Invalid email address.", { status: 400 });
  }

  if (password.length < 8) {
    throw new HTTPError("Password must be at least 8 characters long.", { status: 400 });
  }

  if (name.length < 2 || name.length > 100) {
    throw new HTTPError("Name must be between 2 and 100 characters.", { status: 400 });
  }

  const db = getDb();

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new HTTPError("Email already registered.", { status: 409 });
  }

  let passwordHash: string;

  try {
    passwordHash = await hashPassword(password);
  } catch {
    throw new HTTPError("Failed to process password.", { status: 500 });
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      password: passwordHash,
      name,
    })
    .returning();

  if (!newUser) {
    throw new HTTPError("Failed to create user.", { status: 500 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    await db.insert(emailVerificationTokens).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    await sendVerificationEmail(newUser.email, token, newUser.name);
  } catch {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, newUser.id));
    await db.delete(users).where(eq(users.id, newUser.id));
    throw new HTTPError("Failed to send verification email.", { status: 500 });
  }

  return {
    message: "Registration successful. Please check your email to verify your account.",
  };
});
