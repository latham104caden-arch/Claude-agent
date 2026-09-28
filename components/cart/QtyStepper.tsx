"use client";

import { Icon } from "../Icon";

export function QtyStepper({
  value,
  onChange,
  label,
  min = 0,
  large = false,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  min?: number;
  large?: boolean;
}) {
  return (
    <div className={"qty" + (large ? " qty--lg" : "")} role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(Math.max(min, value - 1))}>
        <Icon name="minus" />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(Math.min(99, value + 1))}>
        <Icon name="plus" />
      </button>
    </div>
  );
}
