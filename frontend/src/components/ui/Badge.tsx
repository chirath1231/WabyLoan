import { cn } from '@/lib/cn';

type BadgeTone = 'gold' | 'teal' | 'danger' | 'amber' | 'violet' | 'grey';

const toneClasses: Record<BadgeTone, string> = {
  gold: 'bg-gold-100 text-gold-700',
  teal: 'bg-teal-100 text-teal-700',
  danger: 'bg-danger-100 text-danger',
  amber: 'bg-amber-100 text-amber-700',
  violet: 'bg-violet-100 text-violet-700',
  grey: 'bg-gray-100 text-gray-600',
};

export function Badge({ tone = 'grey', children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide', toneClasses[tone], className)}>
      {children}
    </span>
  );
}
