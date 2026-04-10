import * as React from "react"
import { cn } from "@/utils/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#1e3a8a] text-white hover:bg-[#152e6f] hover:shadow-lg hover:shadow-blue-900/10 shadow-sm active:scale-[0.98]": variant === "default",
            "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 hover:border-slate-300": variant === "outline",
            "hover:bg-blue-50 hover:text-[#1e3a8a] text-slate-600": variant === "ghost",
            "bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:scale-[0.98]": variant === "danger",
            "h-12 px-6 py-2": size === "default",
            "h-9 px-3 text-sm": size === "sm",
            "h-14 px-8 text-lg text-[15px] font-bold": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
