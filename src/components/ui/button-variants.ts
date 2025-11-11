import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-transform transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:-translate-y-0.5 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#E8B90D]",
        accent: "bg-accent text-accent-foreground hover:bg-[#152133]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-[#9C1818]",
        outline:
          "border border-[rgba(0,0,0,0.1)] bg-white text-foreground hover:bg-[rgba(28,36,49,0.06)]",
        secondary:
          "border border-[rgba(0,0,0,0.08)] bg-[rgba(28,36,49,0.05)] text-foreground hover:bg-[rgba(28,36,49,0.09)]",
        ghost: "text-muted-foreground hover:bg-[rgba(28,36,49,0.06)] hover:text-[#1C2431]",
        link: "text-[#c18b00] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
