import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-line bg-card', className)} {...props} />;
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-teal-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-600">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-text-900 tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-text-400">{hint}</p>}
    </div>
  );
}
