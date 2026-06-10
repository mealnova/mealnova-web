import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.01em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-[var(--color-primary-100)] bg-[var(--color-primary-50)] text-[var(--color-primary-500)]",
        secondary: "border-[var(--color-secondary-100)] bg-[var(--color-secondary-50)] text-[var(--color-secondary-600)]",
        success: "border-green-200 bg-green-50 text-green-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        danger: "border-red-200 bg-red-50 text-red-700",
        outline: "border-black/10 bg-white text-[var(--color-text-secondary)]",
        veg: "border-green-200 bg-green-50 text-green-700",
        jain: "border-amber-200 bg-amber-50 text-amber-700",
        vegan: "border-emerald-200 bg-emerald-50 text-emerald-700",
        spicy: "border-red-200 bg-red-50 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
