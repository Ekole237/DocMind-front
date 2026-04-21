import { cn } from "@workspace/ui/lib/utils"
import * as React from "react"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-input text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
