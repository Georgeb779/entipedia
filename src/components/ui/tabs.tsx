import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/utils";

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

type TabsTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

type TabsContentProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<React.ComponentRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-12 w-full items-center justify-center gap-1 rounded-lg p-1 md:max-w-3xs",
        className,
      )}
      {...props}
    />
  ),
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex w-full min-w-5 items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
      "max-w-full min-w-0 truncate",
      "hover:text-foreground focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none",
      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      "data-[state=inactive]:text-muted-foreground data-[state=inactive]:cursor-pointer",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("border-border bg-card rounded-lg border p-6", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
