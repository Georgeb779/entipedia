import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 ease-out hover:scale-105 active:scale-95 will-change-transform focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-primary/80 hover:text-primary-foreground hover:shadow-md hover:shadow-[#F6C90E]/20",
        secondary: "border-transparent bg-muted text-foreground hover:bg-accent/80 hover:shadow-sm",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/20",
        outline:
          "border-border text-foreground hover:bg-[rgba(246,201,14,0.08)] hover:border-[#F6C90E]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
