import React from 'react';
import { Users } from 'lucide-react';
import { useStage } from '../../context/StageContext';

interface ConnectionStatusProps {
  onClick: () => void;
}

/**
 * Stage readiness at a glance.
 *
 * Only surfaces data the app actually has: connection state and the number of
 * clients the bridge reports. Latency and display counts are deliberately not
 * shown - the bridge does not expose them, and inventing numbers on a stage
 * control surface would be worse than omitting them.
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onClick }) => {
  const { connectionState, connectedUsers } = useStage();

  const primary = (): string => {
    switch (connectionState) {
      case 'connected':
        return 'Stage Ready';
      case 'connecting':
        return 'Connecting';
      case 'error':
        return 'Stage Error';
      default:
        return 'Disconnected';
    }
  };

  const secondary = (): string | null => {
    if (connectionState !== 'connected') return null;
    const n = connectedUsers.length;
    return n > 0 ? `${n} client${n === 1 ? '' : 's'}` : 'Linked';
  };

  const sub = secondary();

  return (
    <button
      type="button"
      className={`status-pill ${connectionState}`}
      onClick={onClick}
      title="Connection settings"
    >
      <span className="status-pill-dot" />
      <span className="status-pill-text">
        <span className="status-pill-primary">{primary()}</span>
        {sub && (
          <span className="status-pill-secondary">
            {connectedUsers.length > 0 && (
              <Users size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />
            )}
            {sub}
          </span>
        )}
      </span>
    </button>
  );
};
