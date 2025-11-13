import { readFile } from "node:fs/promises";
import { join } from "node:path";

let cachedIndexHtml: string | null = null;
let triedLoadingIndex = false;

async function loadBuiltIndexHtml(): Promise<string | null> {
  if (cachedIndexHtml) {
    return cachedIndexHtml;
  }
  if (triedLoadingIndex) {
    return null;
  }

  const cwd = process.cwd();
  const candidates = [
    process.env.NITRO_PUBLIC_DIR ? join(process.env.NITRO_PUBLIC_DIR, "index.html") : null,
    join(cwd, ".output/public/index.html"),
    join(cwd, "dist/index.html"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidatePath of candidates) {
    try {
      const html = await readFile(candidatePath, "utf-8");
      cachedIndexHtml = html;
      triedLoadingIndex = true;
      return cachedIndexHtml;
    } catch {
      continue;
    }
  }

  triedLoadingIndex = true;
  return null;
}

export default {
  async fetch(req: Request): Promise<Response | undefined> {
    const url = new URL(req.url);
    const method = req.method?.toUpperCase() ?? "GET";
    const accept = req.headers.get("accept") ?? "";
    const secFetchDest = req.headers.get("sec-fetch-dest") ?? "";

    if (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/uploads/")
    ) {
      return undefined;
    }

    const isDev = process.env.NODE_ENV !== "production";
    const useProxy = process.env.VITE_USE_PROXY === "true";

    // When running integrated dev mode (Vite handles routes), skip the fallback
    if (isDev && !useProxy) {
      return undefined;
    }

    const assetLike = /\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|json|txt|map)$/i;
    if (assetLike.test(url.pathname)) {
      return undefined;
    }

    const isDocumentRequest = secFetchDest === "" || secFetchDest === "document";
    const acceptsHtml = accept.includes("text/html");

    if ((method === "GET" || method === "HEAD") && (isDocumentRequest || acceptsHtml)) {
      const html = await loadBuiltIndexHtml();
      if (html) {
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
    }

    return undefined;
  },
};
