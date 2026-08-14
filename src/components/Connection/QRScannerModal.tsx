import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '../Common/Modal';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedIpOrUrl: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'cuenect-qr-reader';

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText: string) => {
            scanner.stop().then(() => {
              onScanSuccess(decodedText);
              onClose();
            });
          },
          () => {
            // Ignore scan parse errors per frame
          }
        );
      } catch (err) {
        console.error('Unable to start camera scanner:', err);
      }
    };

    // Small delay to allow modal DOM rendering
    const timer = setTimeout(startScanner, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Stage QR Code" maxWidth="400px">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div
          id={elementId}
          style={{
            width: '100%',
            minHeight: '280px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#000'
          }}
        />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Point camera at the QR code displayed on the Hologram Stage.
        </p>
      </div>
    </Modal>
  );
};
