import { defineHandler } from "nitro/h3";
import { HTTPError } from "h3";

export default defineHandler((event) => {
  const user = event.context.user as { name: string } | null;

  if (!user) {
    throw new HTTPError("Unauthorized", { statusCode: 401 });
  }

  return {
    success: true,
    message: `Hello ${user.name}`,
  };
});
