import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/utils";

type SeparatorProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

type SeparatorElement = React.ElementRef<typeof SeparatorPrimitive.Root>;

const Separator = React.forwardRef<SeparatorElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = false, ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-gray-700",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
