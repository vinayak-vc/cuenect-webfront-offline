import React from 'react';
import { Users, Lock } from 'lucide-react';
import { useStage } from '../../context/StageContext';

interface ConnectionStatusProps {
  onClick: () => void;
}

/**
 * Stage readiness & operator link at a glance.
 *
 * Disambiguates between physical network connection ('Connected' vs 'Offline')
 * and multi-operator control state ('Controlling Stage' vs 'Spectating').
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onClick }) => {
  const { connectionState, connectedUsers, controlLock } = useStage();

  const isConnected = connectionState === 'connected';
  const isSpectating = isConnected && controlLock.locked && !controlLock.youHaveControl;

  const primary = (): string => {
    switch (connectionState) {
      case 'connected':
        return isSpectating ? 'Spectating' : 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'error':
        return 'Link Error';
      default:
        return 'Offline';
    }
  };

  const secondary = (): string | null => {
    if (!isConnected) return null;
    if (isSpectating) {
      return controlLock.holderName || 'Operator';
    }
    const n = connectedUsers.length;
    return n > 1 ? `${n} operators` : 'Live';
  };

  const sub = secondary();

  return (
    <button
      type="button"
      className={`status-pill ${connectionState} ${isSpectating ? 'spectating' : ''}`}
      onClick={onClick}
      title={isSpectating ? `Spectating: controlled by ${controlLock.holderName || 'another operator'}` : 'Stage link & telemetry'}
      aria-label={`Connection status: ${primary()}${sub ? `, ${sub}` : ''}`}
    >
      <span className="status-pill-dot" />
      <span className="status-pill-text">
        <span className="status-pill-primary">{primary()}</span>
        {sub && (
          <span className="status-pill-secondary">
            {isSpectating ? (
              <Lock size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />
            ) : connectedUsers.length > 1 ? (
              <Users size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />
            ) : null}
            {sub}
          </span>
        )}
      </span>
    </button>
  );
};
