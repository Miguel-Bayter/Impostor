import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
        'bg-input border-border h-11 w-full min-w-0 rounded-md border-2 px-4 py-3 text-base text-foreground',
        'transition-[border-color] duration-150 outline-none',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
        'focus:border-ring focus:ring-ring focus:ring-2',
        'aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
