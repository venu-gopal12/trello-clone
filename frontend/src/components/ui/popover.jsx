import * as React from "react"
import { cn } from "@/lib/utils"

// A very simple Popover implementation without Poern heavily relying on absolute positioning
const Popover = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Clone children to inject props
  return (
    <div className="relative inline-block text-left" ref={triggerRef}>
         {React.Children.map(children, child => {
             if (child.type === PopoverTrigger) {
                 return React.cloneElement(child, { onClick: () => setIsOpen(!isOpen) });
             }
             if (child.type === PopoverContent) {
                 return isOpen ? child : null;
             }
             return child;
         })}
    </div>
  )
}

const PopoverTrigger = React.forwardRef(({ asChild, children, ...props }, ref) => {
    // If asChild is true, we should strictly clone the child, but for simplicity we render a primitive if needed
    // or just render the child.
    // The user code uses <PopoverTrigger asChild><Button .../></PopoverTrigger>
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { ref, ...props });
    }
    return <button ref={ref} {...props}>{children}</button>
})

const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <div
    ref={ref}
    style={{ top: 'calc(100% + 4px)' }} 
    className={cn(
      "absolute z-50 w-72 rounded-md border bg-popover p-4 path-to-bottom text-popover-foreground shadow-md outline-none",
      align === "end" ? "right-0" : "left-0", // Simple alignment logic
      className
    )}
    {...props}
  />
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
