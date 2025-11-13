import { readFile } from "node:fs/promises";
import { join } from "node:path";

let cachedIndexHtml: string | null = null;

async function getIndexHtml(): Promise<string> {
  if (cachedIndexHtml) return cachedIndexHtml;
  const cwd = process.cwd();
  const candidates = [
    join(cwd, ".output/public/index.html"),
    join(cwd, "dist/index.html"),
    join(cwd, "public/index.html"),
    join(cwd, "index.html"),
  ];
  for (const p of candidates) {
    try {
      cachedIndexHtml = await readFile(p, "utf-8");
      return cachedIndexHtml;
    } catch {
      // try next
    }
  }
  throw new Error("index.html not found");
}

export default {
  async fetch(req: Request): Promise<Response | undefined> {
    const url = new URL(req.url);
    const method = req.method?.toUpperCase() ?? "GET";
    const accept = req.headers.get("accept") ?? "";
    const secFetchDest = req.headers.get("sec-fetch-dest") ?? "";

    // Let API calls fall through to Nitro internals
    if (url.pathname.startsWith("/api/")) {
      return undefined;
    }

    // Avoid intercepting obvious static asset requests
    const assetLike = /\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|json|txt|map)$/i;
    if (
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/uploads/") ||
      assetLike.test(url.pathname)
    ) {
      return undefined;
    }

    // Only intercept document navigations (SPA fallback)
    const isDocumentRequest = secFetchDest === "" || secFetchDest === "document";
    const acceptsHtml = accept.includes("text/html");
    if ((method === "GET" || method === "HEAD") && (isDocumentRequest || acceptsHtml)) {
      const html = await getIndexHtml();
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return undefined;
  },
};
