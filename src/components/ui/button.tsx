import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  to?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, to, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
      {
        "bg-accent text-accent-foreground hover:bg-accent-hover": variant === "primary",
        "bg-card text-foreground border border-border hover:bg-card-hover": variant === "secondary",
        "bg-transparent text-foreground hover:bg-card-hover": variant === "ghost",
        "bg-transparent text-foreground border border-border hover:bg-card-hover": variant === "outline",
        "bg-oppose text-white hover:bg-red-700": variant === "danger",
        "h-8 px-3 text-sm": size === "sm",
        "h-10 px-4 text-sm": size === "md",
        "h-11 px-6 text-base": size === "lg",
      },
      className
    );

    if (to) {
      return (
        <Link to={to} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} disabled={disabled} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
