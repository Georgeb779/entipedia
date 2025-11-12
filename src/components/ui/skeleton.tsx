import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/utils";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("skeleton h-4 w-full rounded-md bg-[rgba(0,0,0,0.06)]", className)}
    {...props}
  />
));

Skeleton.displayName = "Skeleton";

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

const SkeletonText = ({ lines = 3, className }: SkeletonTextProps) => {
  const safeLines = Math.max(1, lines);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: safeLines }).map((_, index) => {
        const isLast = index === safeLines - 1;
        const widthClass = isLast ? "w-3/5" : index % 2 === 0 ? "w-11/12" : "w-full";

        return <Skeleton key={index} className={cn("h-4", widthClass)} />;
      })}
    </div>
  );
};

type SkeletonCardProps = {
  className?: string;
};

const SkeletonCard = ({ className }: SkeletonCardProps) => (
  <div
    className={cn(
      "space-y-4 rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-6 shadow-sm",
      "animate-card-fade-in touch-action-none select-none",
      className,
    )}
  >
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-10/12" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  </div>
);

type SkeletonTableProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

const SkeletonTable = ({ rows = 5, columns = 6, className }: SkeletonTableProps) => {
  const safeRows = Math.max(1, rows);
  const safeColumns = Math.max(1, columns);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[rgba(0,0,0,0.05)]", className)}>
      <div className="divide-y divide-[rgba(0,0,0,0.05)]">
        {Array.from({ length: safeRows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid items-center gap-4 px-6 py-4"
            style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: safeColumns }).map((__, columnIndex) => {
              const randomWidth = 60 + ((rowIndex + columnIndex) % 4) * 10;
              return (
                <Skeleton
                  key={`${rowIndex}-${columnIndex}`}
                  className="h-4"
                  style={{ width: `${randomWidth}%` }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonText };
export default Skeleton;
