import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background touch-action-manipulation transition-[transform,colors,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:scale-100 focus-visible:shadow-[0_0_0_3px_rgba(246,201,14,0.2),0_0_20px_rgba(246,201,14,0.3)] hover:-translate-y-0.5 hover:shadow-md active:scale-95 will-change-transform disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[#E8B90D] active:bg-[#D4B00C] hover:shadow-[0_0_20px_rgba(246,201,14,0.4)]",
        accent:
          "bg-accent text-accent-foreground hover:bg-[#152133] active:bg-[#0F1825] hover:shadow-[0_0_16px_rgba(28,36,49,0.3)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[#9C1818] active:bg-[#7F1414] hover:shadow-[0_0_16px_rgba(185,28,28,0.3)]",
        outline:
          "border border-[rgba(0,0,0,0.1)] bg-white text-foreground hover:bg-[rgba(28,36,49,0.06)] active:bg-[rgba(28,36,49,0.1)] hover:shadow-[0_0_12px_rgba(0,0,0,0.08)]",
        secondary:
          "border border-[rgba(0,0,0,0.08)] bg-[rgba(28,36,49,0.05)] text-foreground hover:bg-[rgba(28,36,49,0.09)] active:bg-[rgba(28,36,49,0.12)]",
        ghost:
          "text-muted-foreground hover:bg-[rgba(28,36,49,0.06)] hover:text-[#1C2431] active:bg-[rgba(28,36,49,0.1)]",
        link: "text-[#c18b00] underline-offset-4 hover:underline active:opacity-70",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-11 rounded-md px-4",
        lg: "h-12 rounded-md px-8",
        icon: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
