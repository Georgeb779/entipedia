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
        "inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-gray-800 p-1 text-gray-300",
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
      "inline-flex min-w-[120px] items-center justify-center rounded-md px-3 py-2 text-sm font-medium",
      "transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none",
      "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
      "data-[state=inactive]:text-gray-400",
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
    className={cn("rounded-lg border border-gray-800 bg-gray-900 p-6", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
