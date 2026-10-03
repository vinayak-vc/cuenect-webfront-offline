import React, { useState } from 'react';
import { BottomSheet } from '../Common/BottomSheet';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { useStage } from '../../context/StageContext';
import {
  DisplayModeLabels,
  EnvironmentPresetLabels
} from '../../types/protocol';
import { PresentationPanel } from '../Presentation/PresentationPanel';
import {
  Monitor,
  RotateCcw,
  Sliders,
  Plug,
  Maximize,
  RefreshCw,
  Square,
  Lock,
  Unlock,
  Users,
  Sparkles,
  Camera,
  Layers
} from 'lucide-react';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConnection: () => void;
  onOpenProjection?: () => void;
}

/**
 * Categorized System Console (More Sheet):
 * Four structured operational sections:
 * 1. PRESENTATION (Projection, Environment, Camera)
 * 2. STAGE CONTROLS (Reset Transform, Multi-Stage Matrix)
 * 3. SYSTEM & OPTICS (Connection & Operators, Stereo Calibration, Fullscreen, Catalog Sync)
 * 4. DANGER ZONE (Clear Content from Stage with confirmation)
 */
export const MoreSheet: React.FC<MoreSheetProps> = ({
  isOpen,
  onClose,
  onOpenConnection
}) => {
  const {
    connectionState,
    config,
    connectedUsers,
    activeAsset,
    unloadAsset,
    resetModelTransform,
    setIsSettingsOpen,
    displayMode,
    environmentPreset,
    isOrthographic,
    controlLock,
    requestControl,
    releaseControl,
    triggerFullscreen,
    refreshAssets,
    stages,
    selectedStageIds,
    setIsStageDirectorOpen
  } = useStage();

  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const hasControl = controlLock.youHaveControl;
  const onlineStages = stages.filter((s) => s.online);

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="System Console"
        subtitle="Presentation, stage controls, calibration and operators"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Section 1: Multi-Operator Arbitration */}
          <div className="setting-section open" style={{ margin: 0 }}>
            <div className="setting-section-header" style={{ cursor: 'default' }}>
              <span style={{ color: hasControl ? 'var(--status-live)' : 'var(--status-warning)', display: 'flex' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {controlLock.operators.map((op) => (
                    <div key={op.name} className="stage-readout">
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Users size={13} />
                        {op.name}
                      </span>
                      <span
                        className="stage-readout-value"
                        style={{ color: op.hasControl ? 'var(--accent-signature)' : undefined }}
                      >
                        {op.hasControl ? 'Operator' : 'Viewer'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {hasControl ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={releaseControl}
                  style={{ gap: 6, width: '100%' }}
                >
                  <Lock size={15} />
                  Release Control
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={requestControl}
                  style={{ gap: 6, width: '100%' }}
                >
                  <Unlock size={15} />
                  Request Control
                </button>
              )}
            </div>
          </div>

          {/* Section 2: PRESENTATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="u-section-label">Presentation</span>

            <div className="sheet-action-list">
              <button
                type="button"
                className="sheet-action"
                onClick={() => setIsPresentationOpen(true)}
              >
                <Monitor size={17} style={{ color: 'var(--accent-signature)' }} />
                <span>
                  <strong>Projection Mode</strong>
                  <em>{DisplayModeLabels[displayMode]}</em>
                </span>
              </button>

              <button
                type="button"
                className="sheet-action"
                onClick={() => setIsPresentationOpen(true)}
              >
                <Sparkles size={17} style={{ color: 'var(--accent-signature)' }} />
                <span>
                  <strong>Environment Dressing</strong>
                  <em>{EnvironmentPresetLabels[environmentPreset]}</em>
                </span>
              </button>

              <button
                type="button"
                className="sheet-action"
                onClick={() => setIsPresentationOpen(true)}
              >
                <Camera size={17} style={{ color: 'var(--accent-signature)' }} />
                <span>
                  <strong>Camera Projection</strong>
                  <em>{isOrthographic ? 'Orthographic' : 'Perspective'}</em>
                </span>
              </button>
            </div>
          </div>

          {/* Section 3: STAGE CONTROLS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="u-section-label">Stage Controls</span>

            <div className="sheet-action-list">
              <button
                type="button"
                className="sheet-action"
                disabled={!activeAsset || !hasControl}
                onClick={() => {
                  resetModelTransform();
                  onClose();
                }}
              >
                <RotateCcw size={17} style={{ color: 'var(--accent-signature)' }} />
                <span>
                  <strong>Reset Transform</strong>
                  <em>Return rotation, pan, and zoom to starting defaults</em>
                </span>
              </button>

              {stages.length > 0 && (
                <button
                  type="button"
                  className="sheet-action"
                  onClick={() => {
                    onClose();
                    setIsStageDirectorOpen(true);
                  }}
                >
                  <Layers size={17} style={{ color: 'var(--accent-signature)' }} />
                  <span>
                    <strong>Screen Matrix (Stage Director)</strong>
                    <em>{selectedStageIds.size} of {onlineStages.length} online stages targeted</em>
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Section 4: SYSTEM & OPTICS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="u-section-label">System & Optics</span>

            <div className="sheet-action-list">
              <button
                type="button"
                className="sheet-action"
                onClick={() => {
                  onClose();
                  onOpenConnection();
                }}
              >
                <Plug size={17} style={{ color: 'var(--accent-signature)' }} />
                <span>
                  <strong>Connection & Network</strong>
                  <em>
                    {connectionState === 'connected'
                      ? `${config.serverIp || 'server'} · ${connectedUsers.length} online`
                      : 'Not connected'}
                  </em>
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
                <Sliders size={17} style={{ color: 'var(--accent-signature)' }} />
                <span>
                  <strong>Stereo & Optics Calibration</strong>
                  <em>IPD, zero parallax focal plane, FOV, convergence</em>
                </span>
              </button>

              <button
                type="button"
                className="sheet-action"
                onClick={() => {
                  triggerFullscreen();
                  onClose();
                }}
              >
                <Maximize size={17} style={{ color: 'var(--accent-signature)' }} />
                <span>
                  <strong>Toggle Fullscreen Stage Display</strong>
                  <em>Switch desktop player between windowed and fullscreen</em>
                </span>
              </button>

              <button
                type="button"
                className="sheet-action"
                disabled={connectionState !== 'connected'}
                onClick={() => {
                  refreshAssets();
                  onClose();
                }}
              >
                <RefreshCw size={17} style={{ color: 'var(--accent-signature)' }} />
                <span>
                  <strong>Sync Asset Catalog</strong>
                  <em>Request latest 3D models and database from server</em>
                </span>
              </button>
            </div>
          </div>

          {/* Section 5: DANGER ZONE (Clear Stage) */}
          {activeAsset && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="u-section-label" style={{ color: 'var(--status-danger)' }}>
                Danger Zone
              </span>

              <div className="sheet-action-list">
                <button
                  type="button"
                  className="sheet-action danger"
                  disabled={!hasControl}
                  onClick={() => setIsClearConfirmOpen(true)}
                >
                  <Square size={17} />
                  <span>
                    <strong style={{ color: 'var(--status-danger)' }}>Clear Content from Stage</strong>
                    <em>Unload "{activeAsset.AssetName}" and restore the default logo</em>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Canonical Presentation Panel */}
      <PresentationPanel
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
      />

      {/* Confirm Dialog for Destructive Clear */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Clear Content from Stage?"
        message={`Are you sure you want to unload "${activeAsset?.AssetName || 'the active model'}" from the stage? The physical exhibit will immediately return to the company logo.`}
        confirmLabel="Clear Stage"
        destructive
        onCancel={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          setIsClearConfirmOpen(false);
          unloadAsset();
          onClose();
        }}
      />
    </>
  );
};
