import React from 'react';

interface StateViewProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tone?: 'default' | 'danger';
}

/**
 * Shared shell for loading / empty / error states so every system state
 * speaks the same visual language: what happened, then what to do next.
 */
export const StateView: React.FC<StateViewProps> = ({
  icon,
  title,
  description,
  actions,
  tone = 'default'
}) => (
  <div className="state-panel">
    <div className={`state-icon ${tone === 'danger' ? 'danger' : ''}`}>{icon}</div>
    <h2 className="state-title">{title}</h2>
    {description && <p className="state-desc">{description}</p>}
    {actions && <div className="state-actions">{actions}</div>}
  </div>
);

/** Placeholder grid shown while the catalog is still syncing. */
export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="asset-grid" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-block skeleton-thumb" />
        <div className="skeleton-block skeleton-line" />
        <div className="skeleton-block skeleton-line short" />
      </div>
    ))}
  </div>
);
