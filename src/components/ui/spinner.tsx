import { forwardRef, type HTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/utils";

type SpinnerSize = "sm" | "md" | "lg" | "xl";

type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  size?: SpinnerSize;
  label?: string;
};

const sizeMap: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", label = "Cargando...", ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-label={label}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-[#F6C90E]", sizeMap[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  ),
);

Spinner.displayName = "Spinner";

type SpinnerOverlayProps = {
  message?: string;
  size?: SpinnerSize;
  className?: string;
};

const SpinnerOverlay = ({ message, size = "lg", className }: SpinnerOverlayProps) => (
  <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}>
    <Spinner size={size} label={message ?? "Cargando..."} />
    {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
  </div>
);

export { Spinner, SpinnerOverlay };
export default Spinner;
