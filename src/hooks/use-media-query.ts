import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const getMatch = () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false);

  const [matches, setMatches] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  // Tailwind's md breakpoint is 768px; use < md as "mobile"
  return useMediaQuery("(max-width: 767.98px)");
}
