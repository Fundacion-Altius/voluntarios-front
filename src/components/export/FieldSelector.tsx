'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface FieldSelectorProps {
  fields: string[];
  selected: string[];
  onChange: (fields: string[]) => void;
}

export function FieldSelector({ fields, selected, onChange }: FieldSelectorProps) {
  const toggle = (field: string) => {
    if (selected.includes(field)) onChange(selected.filter((item) => item !== field));
    else onChange([...selected, field]);
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field} className="flex items-center gap-2">
          <Checkbox id={`field-${field}`} checked={selected.includes(field)} onCheckedChange={() => toggle(field)} />
          <Label htmlFor={`field-${field}`}>{field}</Label>
        </div>
      ))}
    </div>
  );
}
