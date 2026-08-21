'use client';

import * as RadixSwitch from '@radix-ui/react-switch';

export function Switch({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5">
      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative h-6 w-11 flex-shrink-0 rounded-full bg-line transition-colors data-[state=checked]:bg-teal-700"
      >
        <RadixSwitch.Thumb className="block h-[18px] w-[18px] translate-x-[3px] rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[23px]" />
      </RadixSwitch.Root>
      {label && <span className="text-sm text-text-900">{label}</span>}
    </label>
  );
}
