'use client';

import { cn } from '@/lib/cn';

export function ChoiceCard({
  selected,
  disabled,
  onClick,
  icon,
  title,
  subtitle,
  badge,
}: {
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full flex-col items-start gap-2 rounded-xl2 border-[1.5px] bg-card p-4 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-100',
        disabled
          ? 'cursor-not-allowed border-line opacity-55'
          : selected
            ? 'border-teal-700 bg-teal-50'
            : 'border-line hover:border-teal-600',
      )}
    >
      <div className="flex w-full items-center justify-between">
        {icon}
        {badge}
      </div>
      <div>
        <p className="font-display font-semibold text-text-900">{title}</p>
        {subtitle && <p className="mt-0.5 text-[13px] text-text-600">{subtitle}</p>}
      </div>
    </button>
  );
}
