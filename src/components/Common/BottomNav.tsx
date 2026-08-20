import React from 'react';
import { LayoutGrid, ListMusic, Gamepad2, SlidersHorizontal } from 'lucide-react';
import { useStage } from '../../context/StageContext';

export type MobileSection = 'assets' | 'playlist' | 'control' | 'settings';

interface BottomNavProps {
  active: MobileSection;
  onSelect: (section: MobileSection) => void;
}

/**
 * Mobile primary navigation. Four destinations only - anything rarer lives in
 * a sheet reached from those screens, so the bar stays thumb-sized.
 */
export const BottomNav: React.FC<BottomNavProps> = ({ active, onSelect }) => {
  const { customPlaylistIds, activeAsset } = useStage();

  const items: Array<{
    id: MobileSection;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    dot?: boolean;
  }> = [
    { id: 'assets', label: 'Assets', icon: <LayoutGrid size={20} /> },
    { id: 'playlist', label: 'Playlist', icon: <ListMusic size={20} />, badge: customPlaylistIds.length },
    { id: 'control', label: 'Control', icon: <Gamepad2 size={20} />, dot: !!activeAsset },
    { id: 'settings', label: 'Stage', icon: <SlidersHorizontal size={20} /> }
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`bottom-nav-item ${active === item.id ? 'active' : ''}`}
          onClick={() => onSelect(item.id)}
          aria-current={active === item.id ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
          {!!item.badge && item.badge > 0 && <span className="bottom-nav-badge">{item.badge}</span>}
          {item.dot && !item.badge && (
            <span
              className="bottom-nav-badge"
              style={{ minWidth: 8, height: 8, padding: 0 }}
              aria-label="Asset on stage"
            />
          )}
        </button>
      ))}
    </nav>
  );
};
