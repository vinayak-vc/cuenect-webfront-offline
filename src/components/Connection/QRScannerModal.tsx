import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { Modal } from '../Common/Modal';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';

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
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
      setIsLoading(true);
      setErrorMsg('');
      return;
    }

    let isMounted = true;

    const initScanner = async () => {
      setIsLoading(true);
      setErrorMsg('');

      try {
        // Enumerate video input devices
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        setCameras(devices);

        let selectedId = '';
        if (devices && devices.length > 0) {
          // Prefer back/rear camera
          const backCam = devices.find((d) =>
            /back|rear|environment|main/i.test(d.label)
          );
          selectedId = backCam ? backCam.id : devices[devices.length - 1].id;
        }

        setActiveCameraId(selectedId);

        // Instantiate scanner
        const scanner = new Html5Qrcode(elementId, { verbose: false });
        scannerRef.current = scanner;

        const scanConfig: Html5QrcodeCameraScanConfig = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.max(180, Math.floor(minEdge * 0.75));
            return { width: edgeSize, height: edgeSize };
          },
          aspectRatio: 1.0
        };

        const cameraSource = selectedId ? { deviceId: { exact: selectedId } } : { facingMode: 'environment' };

        await scanner.start(
          cameraSource,
          scanConfig,
          (decodedText: string) => {
            scanner.stop().catch(() => {}).then(() => {
              onScanSuccess(decodedText);
              onClose();
            });
          },
          () => {
            // Ignore scan frame decode failures
          }
        );

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error('Camera QR scanner init error:', err);
        if (isMounted) {
          setIsLoading(false);
          const errString = err instanceof Error ? err.message : String(err);
          setErrorMsg(
            errString.includes('Permission') || errString.includes('NotAllowedError')
              ? 'Camera permission denied. Please allow camera access in your browser settings.'
              : 'Unable to start camera feed. Please check camera permissions and retry.'
          );
        }
      }
    };

    // 250ms delay for modal DOM render
    const timer = window.setTimeout(initScanner, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

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
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.max(180, Math.floor(minEdge * 0.75));
          return { width: edgeSize, height: edgeSize };
        },
        aspectRatio: 1.0
      };

      await scannerRef.current.start(
        { deviceId: { exact: nextCamera.id } },
        scanConfig,
        (decodedText: string) => {
          scannerRef.current?.stop().catch(() => {}).then(() => {
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
                Starting camera feed...
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
                gap: 8,
                color: 'var(--color-danger)'
              }}
            >
              <AlertCircle size={28} />
              <p style={{ fontSize: '0.8rem' }}>{errorMsg}</p>
            </div>
          )}

          <div id={elementId} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Camera Switch & Hint */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem'
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>
            Point at the Hologram Stage QR code
          </span>

          {cameras.length > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSwitchCamera}
              disabled={isLoading}
              style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}
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
