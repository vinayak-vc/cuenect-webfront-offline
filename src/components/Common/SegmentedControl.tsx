import React from 'react';

export interface SegmentedOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Smaller variant for dense panels. */
  compact?: boolean;
  ariaLabel: string;
}

/**
 * Single-choice control where exactly one option is active. Uses buttons with
 * aria-pressed rather than radio inputs so it stays keyboard- and
 * screen-reader-navigable while allowing icon + label content.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  compact = false,
  ariaLabel
}: SegmentedControlProps<T>) {
  return (
    <div className={`segmented ${compact ? 'compact' : ''}`} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className="segmented-item"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
