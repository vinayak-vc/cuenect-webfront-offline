import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { Modal } from '../Common/Modal';
import { QRScannerModal } from './QRScannerModal';
import { QrCode, Wifi, WifiOff } from 'lucide-react';
import { ConnectionConfig } from '../../services/storage';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const { config, connect, disconnect, connectionState } = useStage();
  const [ip, setIp] = useState<string>(config.serverIp || '');
  const [usePort, setUsePort] = useState<boolean>(config.usePort);
  const [port, setPort] = useState<number>(config.port || 9000);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

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
    // If QR contains ws:// or IP:port
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
        <div className="form-group">
          <label className="form-label">Server IP or Hostname</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="e.g. 192.168.1.50 or socket.cuenect.in"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsScannerOpen(true)}
              title="Scan Stage QR"
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
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleConnect}
          >
            <Wifi size={18} />
            Connect
          </button>

          {connectionState === 'connected' && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                disconnect();
                onClose();
              }}
            >
              <WifiOff size={18} />
              Disconnect
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
