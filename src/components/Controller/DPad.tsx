import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { JoyStickDirection } from '../../types/protocol';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export const DPad: React.FC = () => {
  const { sendModelJoystick, resetModelTransform } = useStage();
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  const handlePointerDown = (dirKey: string, xPos: number, yPos: number) => {
    setActiveBtn(dirKey);
    sendModelJoystick(JoyStickDirection.Move, xPos, yPos);
  };

  const handleZoomDown = (zoomKey: string, zoomVal: number) => {
    setActiveBtn(zoomKey);
    sendModelJoystick(JoyStickDirection.Scale, 0, 0, zoomVal);
  };

  const handlePointerUp = () => {
    setActiveBtn(null);
    sendModelJoystick(JoyStickDirection.End);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Directional Pad */}
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
          aria-label="Tilt Up"
        >
          <ChevronUp size={28} />
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
          aria-label="Tilt Down"
        >
          <ChevronDown size={28} />
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
          aria-label="Rotate Left"
        >
          <ChevronLeft size={28} />
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
          aria-label="Rotate Right"
        >
          <ChevronRight size={28} />
        </button>

        <button
          type="button"
          className="dpad-center-reset"
          onClick={resetModelTransform}
          title="Reset Rotation & Scale"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Zoom In & Out */}
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
        >
          <ZoomOut size={18} />
          Zoom Out
        </button>
      </div>
    </div>
  );
};
