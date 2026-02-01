import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

// Since I didn't install radix-ui/react-slot, I'll allow Slot usage only if I install it, 
// or implement a basic version. For now, I'll use a simpler version without Slot unless I install it.
// Actually, I'll install @radix-ui/react-slot as it's very useful for composition.
// But user requested minimal distractions. I'll stick to basic props for now to avoid extra deps if possible,
// OR just install it. The prompt says "Do NOT build in-app phone call...". Doesn't restrict UI libs.
// Radix is standard. I'll skip Slot for now to keep it dependency-light, using `asChild` pattern manually if needed, 
// or just standard button.

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
                        "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
                        "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
                        "text-primary underline-offset-4 hover:underline": variant === "link",
                        "bg-red-500 text-white hover:bg-red-600": variant === "destructive",
                        "h-10 px-4 py-2": size === "default",
                        "h-9 rounded-md px-3": size === "sm",
                        "h-11 rounded-md px-8": size === "lg",
                        "h-10 w-10": size === "icon",
                    },
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
