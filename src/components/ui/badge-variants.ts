import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gray-700 text-gray-100 hover:bg-gray-600",
        secondary: "border-transparent bg-gray-800 text-gray-200 hover:bg-gray-700",
        destructive: "border-transparent bg-red-600 text-white hover:bg-red-500",
        outline: "border-gray-600 text-gray-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
