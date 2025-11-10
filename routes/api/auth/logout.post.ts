import { defineHandler } from "nitro/h3";
import { getSession } from "../../utils/session";

export default defineHandler(async (event) => {
  const session = await getSession(event);

  await session.clear();

  return {
    success: true,
    message: "Logged out successfully.",
  };
});
