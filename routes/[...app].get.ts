import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { defineHandler } from "nitro/h3";

const distDir = fileURLToPath(new URL("../dist", import.meta.url));
const indexFilePath = join(distDir, "index.html");

const jsonResponse = (payload: unknown, status: number) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });

const createNotFoundResponse = () => jsonResponse({ error: "Not Found" }, 404);

export default defineHandler(async (event) => {
  const method = event.req.method ?? "GET";
  const { pathname } = event.url;

  if (method !== "GET" && method !== "HEAD") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  if (pathname.startsWith("/api/")) {
    return createNotFoundResponse();
  }

  if (pathname === "/health") {
    return createNotFoundResponse();
  }

  if (pathname.includes(".") && !pathname.endsWith(".html")) {
    return createNotFoundResponse();
  }

  let html: string;

  try {
    html = await fs.readFile(indexFilePath, "utf8");
  } catch {
    return jsonResponse({ error: "Application shell not found" }, 404);
  }

  if (method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
});
