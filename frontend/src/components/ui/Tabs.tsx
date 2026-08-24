'use client';

import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

export function Tabs({
  value,
  onValueChange,
  tabs,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  tabs: { value: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange}>
      <RadixTabs.List className="mb-4 inline-flex gap-1 rounded-xl border border-line bg-card p-1">
        {tabs.map((t) => (
          <RadixTabs.Trigger
            key={t.value}
            value={t.value}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold text-text-600 transition-colors',
              'data-[state=active]:bg-teal-700 data-[state=active]:text-white',
            )}
          >
            {t.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}

export const TabPanel = RadixTabs.Content;
