import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[12.5px] font-semibold text-text-600">{children}</label>;
}

export function Hint({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'danger' | 'amber' }) {
  const color = tone === 'danger' ? 'text-danger' : tone === 'amber' ? 'text-amber-700' : 'text-text-400';
  return <p className={cn('mt-1 text-[11.5px]', color)}>{children}</p>;
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({ invalid, className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-[10px] border-[1.5px] bg-card px-3 py-2.5 text-sm transition-colors',
        'focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
      {...props}
    />
  );
}

export function MoneyInput({
  value,
  onChange,
  ...props
}: { value: number; onChange: (v: number) => void } & Omit<TextInputProps, 'value' | 'onChange' | 'type' | 'inputMode'>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-400">LKR</span>
      <TextInput
        {...props}
        type="text"
        inputMode="numeric"
        className="pl-11 font-mono tabular-nums"
        value={value ? value.toLocaleString('en-LK') : ''}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '');
          onChange(raw === '' ? 0 : parseInt(raw, 10));
        }}
      />
    </div>
  );
}
