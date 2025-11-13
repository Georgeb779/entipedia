import { defineEventHandler } from "h3";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

let cachedIndexHtml: string | null = null;

const buildIndexPathCandidates = (): string[] => {
  const relativeCandidates = [
    "../../../public/index.html",
    "../../../../public/index.html",
    "../../public/index.html",
    "../public/index.html",
    "../../index.html",
    "../index.html",
  ].map((relative) => fileURLToPath(new URL(relative, import.meta.url)));

  const cwd = process.cwd();
  const envPublic = process.env.NITRO_PUBLIC_DIR
    ? join(process.env.NITRO_PUBLIC_DIR, "index.html")
    : null;

  const cwdCandidates = [
    join(cwd, ".output/public/index.html"),
    join(cwd, "dist/index.html"),
    join(cwd, "public/index.html"),
    join(cwd, "index.html"),
  ];

  return [envPublic, ...cwdCandidates, ...relativeCandidates]
    .filter((value): value is string => Boolean(value))
    .map((value) => value);
};

const resolveIndexHtml = async (): Promise<string> => {
  if (cachedIndexHtml) {
    return cachedIndexHtml;
  }

  for (const candidatePath of buildIndexPathCandidates()) {
    try {
      cachedIndexHtml = await readFile(candidatePath, "utf-8");
      return cachedIndexHtml;
    } catch {
      continue;
    }
  }

  throw new Error("SPA index.html asset could not be located");
};

export default defineEventHandler(async (event) => {
  // Only serve in production; avoid intercepting Vite in dev/integrated mode
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const method = event.req.method?.toUpperCase() ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    return;
  }

  const url = new URL(event.req.url, "http://localhost");
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/uploads/")
  ) {
    return;
  }

  // Skip if it looks like a static file request
  if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return;
  }

  const acceptHeader = event.req.headers.get("accept") ?? "";
  const secFetchDest = event.req.headers.get("sec-fetch-dest") ?? "";
  const isDocumentRequest = secFetchDest === "" || secFetchDest === "document";
  const acceptsHtml = acceptHeader.includes("text/html");
  if (!isDocumentRequest && !acceptsHtml) {
    return;
  }

  const indexHtml = await resolveIndexHtml();
  event.res.headers.set("Content-Type", "text/html; charset=utf-8");
  return indexHtml;
});
