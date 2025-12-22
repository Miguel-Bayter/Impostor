import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-sm border px-3 py-1.5 text-sm font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors duration-150 overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary/20 text-primary-light border-primary/30 [a&]:hover:bg-primary/30',
        secondary: 'bg-secondary/20 text-secondary-foreground border-secondary/30 [a&]:hover:bg-secondary/30',
        destructive: 'bg-destructive/20 text-destructive border-destructive/30 [a&]:hover:bg-destructive/30',
        success:
          'bg-success/20 text-success border-success/30 [a&]:hover:bg-success/30',
        warning:
          'bg-warning/20 text-warning border-warning/30 [a&]:hover:bg-warning/30',
        outline: 'text-foreground border-border [a&]:hover:bg-hover/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
