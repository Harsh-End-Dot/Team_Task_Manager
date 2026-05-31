import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background/40 px-3 py-2 text-sm shadow-sm transition-colors',
      'placeholder:text-muted-foreground/70',
      'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'aria-[invalid=true]:border-destructive/70 aria-[invalid=true]:focus-visible:ring-destructive/50',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
