'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'ghost' | 'whatsapp' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 disabled:bg-text-400/50 disabled:cursor-not-allowed',
  ghost: 'border border-line text-text-600 hover:border-teal-600 hover:text-teal-700 bg-card',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1EBE59]',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-1',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
});
