import type { CSSProperties, JSX } from "react";

import { cn } from "@/utils";
import logoUrl from "@/assets/entipedia-logo.png";

type LogoMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
  accentColor?: string;
};

const sizeMap: Record<NonNullable<LogoMarkProps["size"]>, { wrapper: string; mask: string }> = {
  sm: {
    wrapper: "h-12 w-12",
    mask: "h-6",
  },
  md: {
    wrapper: "h-16 w-16",
    mask: "h-8",
  },
  lg: {
    wrapper: "h-20 w-20",
    mask: "h-10",
  },
};

export default function LogoMark({
  size = "md",
  className,
  ariaLabel = "Entipedia logo",
  accentColor = "var(--primary)",
}: LogoMarkProps): JSX.Element {
  const dimensions = sizeMap[size];

  const maskStyles: CSSProperties = {
    backgroundColor: accentColor,
    WebkitMaskImage: `url(${logoUrl})`,
    maskImage: `url(${logoUrl})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border border-black/5",
        "bg-white shadow-[0_20px_45px_rgba(17,24,39,0.12)] ring-1 ring-white/40 ring-inset",
        "transition-transform duration-300 ease-out hover:-translate-y-0.5",
        dimensions.wrapper,
        className,
      )}
      role="img"
      aria-label={ariaLabel}
    >
      <span className={cn("block w-3/4", dimensions.mask)} style={maskStyles} aria-hidden="true" />
      <span className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/30 via-transparent to-transparent" />
    </div>
  );
}
