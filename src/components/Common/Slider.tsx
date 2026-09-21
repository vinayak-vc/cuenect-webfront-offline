import React from 'react';

interface SliderProps {
  label: string;
  /** Formatted current value, always visible (e.g. "65 mm", "3.0 m"). */
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Optional scale hints rendered under the track. */
  scale?: string[];
  disabled?: boolean;
}

/**
 * Labelled slider with a permanently visible value readout and a 22px thumb -
 * operable with a thumb on a phone in a dark room.
 */
export const Slider: React.FC<SliderProps> = ({
  label,
  valueLabel,
  value,
  min,
  max,
  step = 1,
  onChange,
  scale,
  disabled = false
}) => {
  const id = React.useId();

  return (
    <div className="slider-row">
      <div className="slider-head">
        <label className="slider-label" htmlFor={id}>
          {label}
        </label>
        <span className="slider-value">{valueLabel}</span>
      </div>

      <input
        id={id}
        className="slider-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        aria-valuetext={valueLabel}
      />

      {scale && scale.length > 0 && (
        <div className="slider-scale">
          {scale.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
};
