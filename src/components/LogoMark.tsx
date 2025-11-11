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
    wrapper: "h-14 w-14",
    mask: "h-7",
  },
  md: {
    wrapper: "h-[4.75rem] w-[4.75rem]",
    mask: "h-9",
  },
  lg: {
    wrapper: "h-[5.75rem] w-[5.75rem]",
    mask: "h-11",
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

  const badgeStyles: CSSProperties = {
    backgroundColor: "#fffbea",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.06)",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border border-black/5",
        "ring-1 ring-white/50 ring-inset",
        "transition-transform duration-300 ease-out hover:-translate-y-0.5",
        dimensions.wrapper,
        className,
      )}
      style={badgeStyles}
      role="img"
      aria-label={ariaLabel}
    >
      <span className={cn("block w-3/4", dimensions.mask)} style={maskStyles} aria-hidden="true" />
      <span className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/35 via-transparent to-transparent" />
    </div>
  );
}
