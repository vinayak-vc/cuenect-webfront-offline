import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ConfiguratorProject } from '../Configurator/types';
import {
  getTemplateInstances,
  deleteTemplateInstance,
  TemplateInstanceRecord,
  INSTANCES_CHANGED_EVENT
} from '../Configurator/templateStorage';
import { useStage } from '../../context/StageContext';
import {
  X,
  Plus,
  Play,
  Check,
  Trash2,
  Edit3,
  Layers,
  Sparkles,
  Clock,
  Image as ImageIcon
} from 'lucide-react';

interface TemplateHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ConfiguratorProject;
  onCreateNew: () => void;
  onEditInStudio: () => void;
}

export const TemplateHubModal: React.FC<TemplateHubModalProps> = ({
  isOpen,
  onClose,
  template,
  onCreateNew,
  onEditInStudio
}) => {
  const {
    assets,
    loadAsset,
    activeAsset,
    customPlaylistIds,
    addToCustomPlaylist,
    removeFromCustomPlaylist,
    deleteAsset,
    addToast
  } = useStage();

  const [instances, setInstances] = useState<TemplateInstanceRecord[]>([]);

  const loadInstances = useCallback(() => {
    if (!template?.id) return;
    setInstances(getTemplateInstances(template.id));
  }, [template?.id]);

  useEffect(() => {
    loadInstances();

    const handleUpdate = () => {
      loadInstances();
    };

    window.addEventListener(INSTANCES_CHANGED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(INSTANCES_CHANGED_EVENT, handleUpdate);
    };
  }, [loadInstances]);

  // Count editable fields
  const editableFieldCount = useMemo(() => {
    return template.layers.filter((l) => Boolean(l.isEditable || l.isTemplateField)).length;
  }, [template]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 14, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '90vh',
          background: '#121217',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0D99FF 0%, #68D9D0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                  {template.title}
                </h3>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(13, 153, 255, 0.18)',
                    color: '#0D99FF',
                    border: '1px solid rgba(13, 153, 255, 0.35)'
                  }}
                >
                  {editableFieldCount} Editable Fields
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#8E9AAA' }}>
                {instances.length === 0
                  ? 'No graphics generated yet. Create multiple cards for each celebrant or joinee.'
                  : `${instances.length} stage graphic${instances.length === 1 ? '' : 's'} created using this template.`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Edit Template in Studio */}
            <button
              type="button"
              onClick={onEditInStudio}
              title="Edit the master template design in Image Studio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#DDDDDD',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Edit3 size={13} />
              <span>Edit Template</span>
            </button>

            {/* Create New Instance Button */}
            <button
              type="button"
              onClick={onCreateNew}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0D99FF 0%, #0077CC 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(13, 153, 255, 0.35)'
              }}
            >
              <Plus size={14} />
              <span>Create New Image</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888888',
                cursor: 'pointer',
                padding: 6,
                display: 'flex',
                borderRadius: 6
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
          {instances.length === 0 ? (
            /* Empty State: Prompt user to create first graphic */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 20px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'rgba(13, 153, 255, 0.12)',
                  border: '1px solid rgba(13, 153, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0D99FF',
                  marginBottom: 16
                }}
              >
                <Sparkles size={28} />
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#FFFFFF', fontWeight: 700 }}>
                No Images Created with This Template Yet
              </h4>
              <p style={{ margin: '0 0 24px 0', fontSize: 13, color: '#8E9AAA', maxWidth: 440, lineHeight: 1.5 }}>
                Fill in the celebrant details (photos, names, greetings) to instantly produce stage-ready cards.
                You can create multiple cards for each baby, celebrant, or new employee.
              </p>
              <button
                type="button"
                onClick={onCreateNew}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 22px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0D99FF 0%, #68D9D0 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(13, 153, 255, 0.4)'
                }}
              >
                <Plus size={16} />
                <span>Create First Image from Template</span>
              </button>
            </div>
          ) : (
            /* Grid of Created Image Instances */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#8E9AAA', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Created Images ({instances.length})
                </span>
                <span style={{ fontSize: 11, color: '#666677' }}>
                  Load directly to stage or manage playlist
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16
                }}
              >
                {instances.map((instance) => {
                  // Find corresponding stage asset if available
                  const matchedAsset =
                    assets.find((a) => a.AssetID === instance.assetId) ||
                    assets.find((a) => a.AssetName === instance.assetName);

                  const resolvedAssetId = matchedAsset ? matchedAsset.AssetID : instance.assetId;
                  const isInPlaylist = resolvedAssetId ? customPlaylistIds.includes(resolvedAssetId) : false;
                  const isLive = matchedAsset && activeAsset?.AssetID === matchedAsset.AssetID;

                  return (
                    <div
                      key={instance.id}
                      style={{
                        background: '#181820',
                        border: `1px solid ${isLive ? '#0D99FF' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Image Preview */}
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '16 / 9',
                          background: '#0B0B0E',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {instance.thumbUrl ? (
                          <img
                            src={instance.thumbUrl}
                            alt={instance.assetName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555566' }}>
                            <ImageIcon size={28} />
                          </div>
                        )}

                        {/* Top Badges */}
                        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6, zIndex: 2 }}>
                          {isLive && (
                            <span
                              style={{
                                background: '#10B981',
                                color: '#FFFFFF',
                                fontSize: 9,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 999,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFF' }} />
                              LIVE
                            </span>
                          )}

                          {isInPlaylist && (
                            <span
                              style={{
                                background: 'rgba(13, 153, 255, 0.9)',
                                color: '#FFFFFF',
                                fontSize: 9,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 999,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <Check size={10} />
                              IN PLAYLIST
                            </span>
                          )}
                        </div>

                        {/* Delete Instance Button */}
                        <button
                          type="button"
                          onClick={() => {
                            deleteTemplateInstance(instance.id);
                            if (resolvedAssetId && deleteAsset) {
                              deleteAsset(resolvedAssetId, false);
                            }
                            if (addToast) {
                              addToast('Removed', `Removed "${instance.assetName}" from list`, 'info');
                            }
                          }}
                          title="Delete this created image"
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'rgba(20, 20, 25, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#999',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 3
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Card Info */}
                      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            title={instance.assetName}
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#FFFFFF',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}
                          >
                            {instance.assetName}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#777788' }}>
                          <Clock size={11} />
                          <span>{new Date(instance.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(instance.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Action Buttons: Load on Stage + Playlist Toggle */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 'auto',
                            paddingTop: 8,
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                          }}
                        >
                          {/* Load / Display on Stage */}
                          <button
                            type="button"
                            onClick={() => {
                              if (matchedAsset && loadAsset) {
                                loadAsset(matchedAsset);
                                if (addToast) {
                                  addToast('Live on Stage', `"${instance.assetName}" is now showing on stage`, 'success');
                                }
                              } else {
                                if (addToast) {
                                  addToast('Asset Loading', `Displaying "${instance.assetName}" on stage`, 'info');
                                }
                              }
                            }}
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: isLive ? '#10B981' : 'linear-gradient(135deg, #0D99FF 0%, #0077CC 100%)',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Play size={11} fill="currentColor" />
                            <span>{isLive ? 'Live' : 'Load'}</span>
                          </button>

                          {/* Add / Remove Playlist */}
                          <button
                            type="button"
                            disabled={!resolvedAssetId}
                            onClick={() => {
                              if (!resolvedAssetId) return;
                              if (isInPlaylist) {
                                removeFromCustomPlaylist(resolvedAssetId);
                              } else {
                                addToCustomPlaylist(resolvedAssetId);
                              }
                            }}
                            title={isInPlaylist ? 'Remove from stage playlist' : 'Add to stage playlist'}
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: isInPlaylist ? 'rgba(13, 153, 255, 0.18)' : '#22222A',
                              border: `1px solid ${isInPlaylist ? '#0D99FF' : 'rgba(255, 255, 255, 0.12)'}`,
                              color: isInPlaylist ? '#0D99FF' : '#CCCCCC',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: !resolvedAssetId ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isInPlaylist ? <Check size={11} /> : <Plus size={11} />}
                            <span>{isInPlaylist ? 'In Playlist' : 'Playlist'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
