import React, { useState, useEffect } from 'react';
import { useStage } from '../../context/StageContext';
import { Modal } from '../Common/Modal';
import { QRScannerModal } from './QRScannerModal';
import { QrCode, Wifi, WifiOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConnectionConfig } from '../../services/storage';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const { config, connect, disconnect, connectionState, connectedUsers } = useStage();
  const [ip, setIp] = useState<string>(config.serverIp || '');
  const [usePort, setUsePort] = useState<boolean>(config.usePort);
  const [port, setPort] = useState<number>(config.port || 9000);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Sync with current config when modal opens
  useEffect(() => {
    if (isOpen) {
      setIp(config.serverIp || '');
      setUsePort(config.usePort);
      setPort(config.port || 9000);
    }
  }, [isOpen, config]);

  const hasConfigChanged =
    ip.trim() !== (config.serverIp || '').trim() ||
    usePort !== config.usePort ||
    (usePort && Number(port) !== (config.port || 9000));

  const handleConnect = () => {
    if (!ip.trim()) return;
    const newConfig: ConnectionConfig = {
      serverIp: ip.trim(),
      usePort,
      port: Number(port) || 9000
    };
    connect(newConfig);
    onClose();
  };

  const handleScanSuccess = (decoded: string) => {
    let cleaned = decoded.replace('ws://', '').replace('wss://', '');
    if (cleaned.includes(':')) {
      const [host, portStr] = cleaned.split(':');
      setIp(host);
      setPort(parseInt(portStr, 10) || 9000);
      setUsePort(true);
    } else {
      setIp(cleaned);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Stage Connection">
        {/* Status Banner */}
        {connectionState === 'connected' && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 'var(--border-radius)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-success)' }}>
                  Currently Connected
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {connectedUsers.length > 0
                    ? `${connectedUsers.length} Active User${connectedUsers.length > 1 ? 's' : ''} Online`
                    : 'Stage Connection Active'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              onClick={() => {
                disconnect();
              }}
            >
              <WifiOff size={14} />
              Disconnect
            </button>
          </div>
        )}

        {connectionState === 'connecting' && (
          <div
            style={{
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: 'var(--border-radius)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={18} className="spin" style={{ color: 'var(--color-warning)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-warning)' }}>
                  Connecting to Stage...
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Handshaking with {config.serverIp}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              onClick={disconnect}
            >
              Cancel
            </button>
          </div>
        )}

        {connectionState === 'error' && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--border-radius)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16
            }}
          >
            <AlertCircle size={18} style={{ color: 'var(--color-danger)' }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>
              Could not reach stage server. Please check IP address and ensure the stage is running.
            </div>
          </div>
        )}

        {/* Input Fields */}
        <div className="form-group">
          <label className="form-label">Server IP or Hostname</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="e.g. 192.168.1.50 or localhost"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              disabled={connectionState === 'connecting'}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsScannerOpen(true)}
              title="Scan Stage QR"
              disabled={connectionState === 'connecting'}
            >
              <QrCode size={18} />
            </button>
          </div>
        </div>

        <div className="form-toggle-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Use Dedicated Port</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Connect via ws:// (Offline LAN default)
            </div>
          </div>
          <input
            type="checkbox"
            checked={usePort}
            onChange={(e) => setUsePort(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
            disabled={connectionState === 'connecting'}
          />
        </div>

        {usePort && (
          <div className="form-group">
            <label className="form-label">Port</label>
            <input
              type="number"
              className="form-input"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value, 10) || 9000)}
              disabled={connectionState === 'connecting'}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {connectionState === 'connected' ? (
            <>
              {hasConfigChanged ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleConnect}
                  disabled={!ip.trim()}
                >
                  <Wifi size={16} />
                  Reconnect with New Settings
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={onClose}
                >
                  Done
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleConnect}
              disabled={!ip.trim() || connectionState === 'connecting'}
            >
              {connectionState === 'connecting' ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wifi size={16} />
                  Connect to Stage
                </>
              )}
            </button>
          )}
        </div>
      </Modal>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
};
