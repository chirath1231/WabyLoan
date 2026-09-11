'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CompareBar({ count, onCompare, onClear }: { count: number; onCompare: () => void; onClear: () => void }) {
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 p-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-2">
        <p className="text-[13px] font-semibold text-text-900">
          {count} offer{count > 1 ? 's' : ''} selected for comparison
        </p>
        <div className="flex items-center gap-2">
          <button onClick={onClear} className="flex items-center gap-1 text-[12.5px] font-semibold text-text-600 hover:text-text-900">
            <X size={13} /> Clear
          </button>
          <Button onClick={onCompare} disabled={count < 2}>
            Compare Selected ({count})
          </Button>
        </div>
      </div>
    </div>
  );
}
