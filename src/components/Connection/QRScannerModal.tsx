import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { Modal } from '../Common/Modal';
import { Camera, AlertCircle, Loader2, Upload, RotateCcw } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const elementId = 'cuenect-qr-reader';
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const stopAndClearScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore stop error
      }
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    setIsLoading(true);
    setErrorMsg('');

    await stopAndClearScanner();

    const scanner = new Html5Qrcode(elementId, { verbose: false });
    scannerRef.current = scanner;

    const scanConfig: Html5QrcodeCameraScanConfig = {
      fps: 10,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edgeSize = Math.max(180, Math.floor(minEdge * 0.75));
        return { width: edgeSize, height: edgeSize };
      }
    };

    const handleSuccess = (decodedText: string) => {
      stopAndClearScanner().then(() => {
        onScanSuccess(decodedText);
        onClose();
      });
    };

    // Strategy 1: Try environment (rear) camera
    try {
      await scanner.start({ facingMode: 'environment' }, scanConfig, handleSuccess, () => {});
      setIsLoading(false);
      // Retrieve available cameras for switch button
      Html5Qrcode.getCameras().then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
        }
      }).catch(() => {});
      return;
    } catch (err1) {
      console.warn('Strategy 1 (environment) failed:', err1);
    }

    // Strategy 2: Try user (front/default) camera
    try {
      await scanner.start({ facingMode: 'user' }, scanConfig, handleSuccess, () => {});
      setIsLoading(false);
      return;
    } catch (err2) {
      console.warn('Strategy 2 (user facing) failed:', err2);
    }

    // Strategy 3: Try device ID from enumerated list if available
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const deviceId = devices[0].id;
        setActiveCameraId(deviceId);
        await scanner.start(deviceId, scanConfig, handleSuccess, () => {});
        setIsLoading(false);
        return;
      }
    } catch (err3) {
      console.warn('Strategy 3 (device enumeration) failed:', err3);
    }

    // If all strategies fail:
    setIsLoading(false);
    setErrorMsg(
      'Camera could not be started. The webcam may be in use by another app (e.g. Teams, Zoom), or camera permission was blocked. You can upload a QR image below.'
    );
  };

  useEffect(() => {
    if (!isOpen) {
      stopAndClearScanner();
      setIsLoading(true);
      setErrorMsg('');
      return;
    }

    const timer = window.setTimeout(startScanner, 300);

    return () => {
      window.clearTimeout(timer);
      stopAndClearScanner();
    };
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setErrorMsg('');

      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(elementId, { verbose: false });
        scannerRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      await stopAndClearScanner();
      onScanSuccess(decodedText);
      onClose();
    } catch (err) {
      console.error('File QR scan error:', err);
      setIsLoading(false);
      setErrorMsg('Could not detect a valid QR code in the uploaded image.');
    }
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;

    const currentIdx = cameras.findIndex((c) => c.id === activeCameraId);
    const nextIdx = (currentIdx + 1) % cameras.length;
    const nextCamera = cameras[nextIdx];

    setIsLoading(true);
    try {
      await scannerRef.current.stop();
      setActiveCameraId(nextCamera.id);

      const scanConfig: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.max(180, Math.floor(minEdge * 0.75));
          return { width: edgeSize, height: edgeSize };
        }
      };

      await scannerRef.current.start(
        nextCamera.id,
        scanConfig,
        (decodedText: string) => {
          stopAndClearScanner().then(() => {
            onScanSuccess(decodedText);
            onClose();
          });
        },
        () => {}
      );
      setIsLoading(false);
    } catch (err) {
      console.error('Camera switch error:', err);
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Stage QR Code" maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {/* Scanner Viewport */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#05070a',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                color: 'var(--color-primary)'
              }}
            >
              <Loader2 size={32} className="spin" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Accessing camera feed...
              </span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                position: 'absolute',
                zIndex: 6,
                padding: 16,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(10, 15, 25, 0.95)',
                color: 'var(--color-danger)'
              }}
            >
              <AlertCircle size={28} />
              <p style={{ fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                {errorMsg}
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={startScanner}
                style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RotateCcw size={14} />
                Retry Camera
              </button>
            </div>
          )}

          <div id={elementId} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Action Controls (Camera Switch & File Upload Fallback) */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Scan from an image or screenshot"
          >
            <Upload size={14} />
            Upload QR Image
          </button>

          {cameras.length > 1 && !errorMsg && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSwitchCamera}
              disabled={isLoading}
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Switch Camera"
            >
              <Camera size={14} />
              Switch Cam
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
