"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary-700)]/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary-600)] text-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] hover:-translate-y-[1px] hover:bg-[var(--color-primary-700)] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] active:translate-y-0",
        secondary:
          "bg-[var(--color-secondary-500)] text-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] hover:-translate-y-[1px] hover:bg-[var(--color-secondary-600)] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] active:translate-y-0",
        outline:
          "border-black/10 bg-white text-[var(--color-text-primary)] hover:-translate-y-[1px] hover:border-black/15 hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06)] active:translate-y-0",
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-warm)] hover:text-[var(--color-text-primary)]",
        white:
          "bg-white text-[var(--color-primary-700)] shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] hover:-translate-y-[1px] hover:bg-[var(--color-surface)] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] active:translate-y-0",
        soft:
          "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-100)] hover:-translate-y-[1px] hover:bg-[var(--color-primary-100)] hover:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.06)] active:translate-y-0",
        link: "text-[var(--color-primary-700)] underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-[15px]",
        xl: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
