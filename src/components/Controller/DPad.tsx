import React, { useState, useEffect } from 'react';
import { useStage } from '../../context/StageContext';
import { JoyStickDirection } from '../../types/protocol';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export const DPad: React.FC = () => {
  const { sendModelJoystick, resetModelTransform } = useStage();
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  const activeBtnRef = React.useRef<string | null>(null);
  const zoomIntervalRef = React.useRef<number | null>(null);

  const handlePointerDown = (dirKey: string, xPos: number, yPos: number) => {
    setActiveBtn(dirKey);
    activeBtnRef.current = dirKey;
    sendModelJoystick(JoyStickDirection.Move, xPos, yPos);
  };

  const handleZoomDown = (zoomKey: string, zoomVal: number) => {
    setActiveBtn(zoomKey);
    activeBtnRef.current = zoomKey;
    sendModelJoystick(JoyStickDirection.Scale, 0, 0, zoomVal);

    if (zoomIntervalRef.current) {
      window.clearInterval(zoomIntervalRef.current);
    }
    zoomIntervalRef.current = window.setInterval(() => {
      sendModelJoystick(JoyStickDirection.Scale, 0, 0, zoomVal);
    }, 150);
  };

  const handlePointerUp = React.useCallback(() => {
    if (zoomIntervalRef.current) {
      window.clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
    if (activeBtnRef.current !== null) {
      activeBtnRef.current = null;
      setActiveBtn(null);
      sendModelJoystick(JoyStickDirection.End, 0, 0);
      sendModelJoystick(JoyStickDirection.Move, 0, 0);
    }
  }, [sendModelJoystick]);

  // Global safety release
  useEffect(() => {
    const handleGlobalRelease = () => {
      handlePointerUp();
    };

    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('blur', handleGlobalRelease);
    document.addEventListener('visibilitychange', handleGlobalRelease);

    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
      document.removeEventListener('visibilitychange', handleGlobalRelease);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    return () => {
      if (zoomIntervalRef.current) {
        window.clearInterval(zoomIntervalRef.current);
        zoomIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Directional Holographic Compass */}
      <div className="dpad-container">
        <button
          type="button"
          className={`dpad-btn dpad-up ${activeBtn === 'up' ? 'active' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handlePointerDown('up', 0, 1);
          }}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchEnd={handlePointerUp}
          aria-label="Tilt Up"
        >
          <ChevronUp size={30} />
        </button>

        <button
          type="button"
          className={`dpad-btn dpad-down ${activeBtn === 'down' ? 'active' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handlePointerDown('down', 0, -1);
          }}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchEnd={handlePointerUp}
          aria-label="Tilt Down"
        >
          <ChevronDown size={30} />
        </button>

        <button
          type="button"
          className={`dpad-btn dpad-left ${activeBtn === 'left' ? 'active' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handlePointerDown('left', -1, 0);
          }}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchEnd={handlePointerUp}
          aria-label="Rotate Left"
        >
          <ChevronLeft size={30} />
        </button>

        <button
          type="button"
          className={`dpad-btn dpad-right ${activeBtn === 'right' ? 'active' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handlePointerDown('right', 1, 0);
          }}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchEnd={handlePointerUp}
          aria-label="Rotate Right"
        >
          <ChevronRight size={30} />
        </button>

        <button
          type="button"
          className="dpad-center-reset"
          onClick={resetModelTransform}
          title="Reset Rotation & Scale"
        >
          <img
            src="/assets/mobile/reload (1).png"
            alt="Reset"
            style={{ width: 22, height: 22, objectFit: 'contain', filter: 'brightness(1.5)' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <RotateCcw size={18} style={{ display: 'none' }} />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button
          type="button"
          className={`btn-zoom ${activeBtn === 'zoomin' ? 'active' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handleZoomDown('zoomin', 1);
          }}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchEnd={handlePointerUp}
        >
          <ZoomIn size={18} />
          Zoom In
        </button>

        <button
          type="button"
          className={`btn-zoom ${activeBtn === 'zoomout' ? 'active' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handleZoomDown('zoomout', 0);
          }}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchEnd={handlePointerUp}
        >
          <ZoomOut size={18} />
          Zoom Out
        </button>
      </div>
    </div>
  );
};
