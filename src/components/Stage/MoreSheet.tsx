import React from 'react';
import { BottomSheet } from '../Common/BottomSheet';
import { useStage } from '../../context/StageContext';
import { DisplayModeLabels } from '../../types/protocol';
import { Plug, Sliders, Monitor, Lock, Unlock, Users, Info } from 'lucide-react';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConnection: () => void;
  onOpenProjection: () => void;
}

/**
 * "More": everything configuration-shaped, kept out of the live control path.
 * Connection, calibration, projection and control ownership.
 */
export const MoreSheet: React.FC<MoreSheetProps> = ({
  isOpen,
  onClose,
  onOpenConnection,
  onOpenProjection
}) => {
  const {
    connectionState,
    config,
    connectedUsers,
    setIsSettingsOpen,
    displayMode,
    controlLock,
    requestControl,
    releaseControl
  } = useStage();

  const hasControl = controlLock.youHaveControl;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="More" subtitle="Stage configuration">
      {/* Control ownership first: it decides whether anything else works. */}
      <div className="setting-section open">
        <div className="setting-section-header" style={{ cursor: 'default' }}>
          <span style={{ color: hasControl ? 'var(--color-primary)' : 'var(--color-warning)', display: 'flex' }}>
            {hasControl ? <Unlock size={18} /> : <Lock size={18} />}
          </span>
          <span>
            <span className="setting-section-title" style={{ display: 'block' }}>
              {hasControl ? 'You have control' : `Controlled by ${controlLock.holderName || 'another operator'}`}
            </span>
            <span className="setting-section-sub">
              {controlLock.operators.length > 0
                ? `${controlLock.operators.length} operator${controlLock.operators.length === 1 ? '' : 's'} connected`
                : 'Single operator'}
            </span>
          </span>
        </div>

        <div className="setting-section-body">
          {controlLock.operators.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {controlLock.operators.map((op) => (
                <div key={op.name} className="stage-readout">
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={13} />
                    {op.name}
                  </span>
                  <span className="stage-readout-value" style={{ color: op.hasControl ? 'var(--color-primary)' : undefined }}>
                    {op.hasControl ? 'Operator' : 'Viewer'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {hasControl ? (
            <button type="button" className="btn btn-secondary" onClick={releaseControl} style={{ gap: 6 }}>
              <Lock size={15} />
              Release Control
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={requestControl} style={{ gap: 6 }}>
              <Unlock size={15} />
              Request Control
            </button>
          )}
        </div>
      </div>

      <div className="sheet-action-list">
        <button
          type="button"
          className="sheet-action"
          onClick={() => {
            onClose();
            onOpenProjection();
          }}
        >
          <Monitor size={17} />
          <span>
            <strong>Projection mode</strong>
            <em>{DisplayModeLabels[displayMode]}</em>
          </span>
        </button>

        <button
          type="button"
          className="sheet-action"
          onClick={() => {
            onClose();
            setIsSettingsOpen(true);
          }}
        >
          <Sliders size={17} />
          <span>
            <strong>Stage settings & calibration</strong>
            <em>Stereo, lighting, camera, advanced</em>
          </span>
        </button>

        <button
          type="button"
          className="sheet-action"
          onClick={() => {
            onClose();
            onOpenConnection();
          }}
        >
          <Plug size={17} />
          <span>
            <strong>Stage connection</strong>
            <em>
              {connectionState === 'connected'
                ? `${config.serverIp || 'stage'} · ${connectedUsers.length} online`
                : 'Not connected'}
            </em>
          </span>
        </button>

        <div className="sheet-action" style={{ cursor: 'default', opacity: 0.75 }}>
          <Info size={17} />
          <span>
            <strong>CUENECT Stage Controller</strong>
            <em>Remote controller for the hologram stage</em>
          </span>
        </div>
      </div>
    </BottomSheet>
  );
};
