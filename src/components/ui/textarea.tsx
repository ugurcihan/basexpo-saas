import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[90px] w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground ring-offset-background",
      "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-brand-indigo/50",
      "disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors duration-200",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
