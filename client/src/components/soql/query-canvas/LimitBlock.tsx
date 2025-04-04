import React from 'react';
import { Input } from '@/components/ui/input';

interface LimitBlockProps {
  limitValue: string;
  onLimitChange: (value: string) => void;
}

export default function LimitBlock({ limitValue, onLimitChange }: LimitBlockProps) {
  return (
    <div>
      <Input
        type="number"
        placeholder="Number of records to return"
        value={limitValue}
        onChange={(e) => onLimitChange(e.target.value)}
        min={1}
        max={2000}
        className="w-full"
      />
      <div className="text-xs text-muted-foreground mt-1">
        Limits the number of records returned (1-2000)
      </div>
    </div>
  );
}