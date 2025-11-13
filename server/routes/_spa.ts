import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineEventHandler, getRequestURL } from "h3";

let cachedHtml: string | null = null;

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);

  // Skip for API routes - let them 404 naturally
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip for actual files (assets, etc.) - let Nitro's static handler serve them
  if (url.pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return;
  }

  // Serve SPA index.html for all other routes
  if (!cachedHtml) {
    const htmlPath = join(process.cwd(), ".output/public/index.html");
    cachedHtml = await readFile(htmlPath, "utf-8");
  }

  event.res.headers.set("Content-Type", "text/html; charset=utf-8");
  event.res.headers.set("Cache-Control", "no-cache");

  return cachedHtml;
});
