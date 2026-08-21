'use client';

import * as RadixSlider from '@radix-ui/react-slider';

export function Slider({
  value,
  onValueChange,
  onValueCommit,
  min,
  max,
  step = 1,
}: {
  value: number;
  onValueChange?: (v: number) => void;
  onValueCommit?: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <RadixSlider.Root
      className="relative flex h-5 w-full touch-none select-none items-center"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onValueChange?.(v)}
      onValueCommit={([v]) => onValueCommit?.(v)}
    >
      <RadixSlider.Track className="relative h-1.5 grow rounded-full bg-line">
        <RadixSlider.Range className="absolute h-full rounded-full bg-teal-700" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="block h-[18px] w-[18px] rounded-full border-[3px] border-white bg-teal-700 shadow ring-1 ring-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        aria-label="Value"
      />
    </RadixSlider.Root>
  );
}
