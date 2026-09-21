import React from 'react';
import { LayoutGrid, ListMusic, Gamepad2, MoreHorizontal } from 'lucide-react';
import { useStage } from '../../context/StageContext';

export type MobileSection = 'assets' | 'playlist' | 'control' | 'more';

interface BottomNavProps {
  active: MobileSection;
  onSelect: (section: MobileSection) => void;
}

/**
 * Primary navigation: Find -> Arrange -> Control -> Configure.
 *
 * "Stage" was merged into "More": tapping Control already means controlling the
 * stage, so a separate Stage destination only split one idea across two tabs.
 * Configuration (connection, calibration, projection, diagnostics) now lives
 * behind More.
 */
export const BottomNav: React.FC<BottomNavProps> = ({ active, onSelect }) => {
  const { customPlaylistIds, activeAsset, controlLock } = useStage();

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
    { id: 'more', label: 'More', icon: <MoreHorizontal size={20} />, dot: controlLock.locked && !controlLock.youHaveControl }
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
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </nav>
  );
};
