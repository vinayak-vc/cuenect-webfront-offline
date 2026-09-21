import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Touch-friendly search input with a clear affordance. */
export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholder = 'Search models, assets, collections...'
}) => (
  <div className="search-field">
    <span className="search-field-icon">
      <Search size={16} />
    </span>
    <input
      className="search-field-input"
      type="search"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search assets"
    />
    {value && (
      <button
        type="button"
        className="search-field-clear"
        onClick={() => onChange('')}
        aria-label="Clear search"
      >
        <X size={14} />
      </button>
    )}
  </div>
);
