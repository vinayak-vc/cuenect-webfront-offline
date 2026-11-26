import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Check,
  RefreshCw,
  Download,
  Edit3,
  Image as ImageIcon,
  Type,
  Send,
  Plus
} from 'lucide-react';
import { ConfiguratorProject, TextLayer, ImageLayer } from '../Configurator/types';
import { generateProjectSVG } from '../Configurator/svgExporter';
import { renderProjectToDataUrl } from '../Configurator/canvasRenderer';
import { useStage } from '../../context/StageContext';
import { GeminiWishGenerator } from '../AI/GeminiWishGenerator';
import { GeminiBackgroundGenerator } from '../AI/GeminiBackgroundGenerator';
import { saveTemplateInstance } from '../Configurator/templateStorage';

interface QuickTemplateModalProps {
  isOpen: boolean;
  template: ConfiguratorProject | null;
  onClose: () => void;
  onOpenInEditor?: (project: ConfiguratorProject) => void;
}

export const QuickTemplateModal: React.FC<QuickTemplateModalProps> = ({
  isOpen,
  template,
  onClose,
  onOpenInEditor
}) => {
  const { loadAsset, addToast } = useStage();

  // Working copy of layer values: mapping layerId -> custom value (string)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushSuccess, setPushSuccess] = useState<boolean>(false);
  const [createdCount, setCreatedCount] = useState<number>(0);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize editable fields whenever template changes
  useEffect(() => {
    if (!template) return;
    const initialValues: Record<string, string> = {};
    template.layers.forEach((l) => {
      if (l.isEditable || l.isTemplateField) {
        if (l.type === 'text') {
          initialValues[l.id] = (l as TextLayer).text || '';
        } else if (l.type === 'image') {
          initialValues[l.id] = (l as ImageLayer).src || '';
        }
      }
    });
    setFieldValues(initialValues);
    setPushSuccess(false);
  }, [template]);

  // List of all editable layers in the template
  const editableLayers = useMemo(() => {
    if (!template) return [];
    return template.layers.filter((l) => Boolean(l.isEditable || l.isTemplateField));
  }, [template]);

  // Construct current customized project
  const customizedProject = useMemo<ConfiguratorProject | null>(() => {
    if (!template) return null;
    return {
      ...template,
      layers: template.layers.map((l) => {
        if ((l.isEditable || l.isTemplateField) && fieldValues[l.id] !== undefined) {
          if (l.type === 'text') {
            return { ...l, text: fieldValues[l.id] } as TextLayer;
          } else if (l.type === 'image') {
            return { ...l, src: fieldValues[l.id] } as ImageLayer;
          }
        }
        return l;
      })
    };
  }, [template, fieldValues]);

  // Live SVG representation for real-time preview
  const liveSvgMarkup = useMemo(() => {
    if (!customizedProject) return '';
    return generateProjectSVG(customizedProject);
  }, [customizedProject]);

  if (!isOpen || !template || !customizedProject) return null;

  // Handle local image file upload for an image layer
  const handleImageUpload = (layerId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFieldValues((prev) => ({
        ...prev,
        [layerId]: result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Push directly to Hologram Stage
  const handlePushToStage = async () => {
    if (isPushing || !customizedProject) return;
    setIsPushing(true);
    setPushSuccess(false);

    try {
      const dataUrl = await renderProjectToDataUrl(customizedProject);
      const title = customizedProject.title || 'Template Graphic';
      const safeName = title.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');

      const payload = {
        assetName: title,
        fileName: `${safeName}_${Date.now()}.png`,
        imageData: dataUrl,
        category: 1, // Image
        playlistName: 'Occasions',
        loadImmediately: true,
        projectData: customizedProject,
        width: customizedProject.width,
        height: customizedProject.height
      };

      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.ok && result.asset) {
        setPushSuccess(true);
        setCreatedCount((prev) => prev + 1);

        // Record template instance for hub and playlist management
        saveTemplateInstance({
          id: `inst_${result.asset.AssetID || Date.now()}`,
          templateId: template.id,
          assetId: result.asset.AssetID,
          assetName: result.asset.AssetName || title,
          thumbUrl: dataUrl,
          createdAt: Date.now(),
          fieldValues: { ...fieldValues },
          projectData: customizedProject
        });

        if (loadAsset) {
          loadAsset(result.asset);
        }
        if (addToast) {
          addToast(
            'Live on Stage!',
            `"${result.asset.AssetName}" is now displayed on the Hologram Stage.`,
            'success'
          );
        }
        setTimeout(() => setPushSuccess(false), 5000);
      } else {
        throw new Error(result.error || 'Server rejected upload');
      }
    } catch (err: any) {
      if (addToast) {
        addToast('Upload Failed', err.message || 'Could not send graphic to stage', 'error');
      }
    } finally {
      setIsPushing(false);
    }
  };

  // Reset fields to create another graphic from the same template
  const handleCreateAnother = () => {
    const cleared: Record<string, string> = {};
    template.layers.forEach((l) => {
      if (l.isEditable || l.isTemplateField) {
        if (l.type === 'text') {
          // Keep secondary greetings/blessings, clear specific names
          const label = (l.editableLabel || l.templateLabel || l.name).toLowerCase();
          if (label.includes('name') || label.includes('photo') || label.includes('title')) {
            cleared[l.id] = '';
          } else {
            cleared[l.id] = (l as TextLayer).text || '';
          }
        } else if (l.type === 'image') {
          cleared[l.id] = (l as ImageLayer).src || '';
        }
      }
    });
    setFieldValues(cleared);
    setPushSuccess(false);
    if (addToast) {
      addToast('Ready for Next Graphic', 'Fields reset. Fill in new details to push another to stage.', 'info');
    }
  };

  // Download high-res PNG locally
  const handleDownloadPNG = async () => {
    if (!customizedProject) return;
    try {
      const dataUrl = await renderProjectToDataUrl(customizedProject);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataUrl);
      downloadAnchor.setAttribute('download', `${customizedProject.title.replace(/\s+/g, '_')}.png`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      if (addToast) addToast('Download Error', err.message, 'error');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1180,
          maxHeight: '92vh',
          background: '#161618',
          border: '1px solid #2E2E32',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          color: '#F0F0F0',
          fontFamily: 'Inter, -apple-system, system-ui, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #26262A',
            background: '#1B1B1F'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0D99FF 0%, #E0458F 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(13,153,255,0.3)'
              }}
            >
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                {template.title}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#90909A' }}>
                Instant Template Customizer • {editableLayers.length} customizable fields
                {createdCount > 0 && ` • ${createdCount} created this session`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onOpenInEditor && (
              <button
                type="button"
                onClick={() => onOpenInEditor(customizedProject)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid #3A3A40',
                  borderRadius: 6,
                  color: '#CCCCCC',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Open in full canvas editor for advanced styling"
              >
                <Edit3 size={13} />
                <span>Open in Editor</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8A8A94',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                display: 'flex'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body: Split View (Left: Form, Right: Live Stage Preview) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '420px 1fr',
            flex: 1,
            overflow: 'hidden',
            minHeight: 520
          }}
        >
          {/* Left Column: Form Fields */}
          <div
            style={{
              padding: '20px 24px',
              borderRight: '1px solid #26262A',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              background: '#161618'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0D99FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Enter Details
              </span>
              <span style={{ fontSize: 11, color: '#777782' }}>Updates preview in real-time</span>
            </div>

            {editableLayers.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#888892', fontSize: 13 }}>
                No elements in this template are marked as editable. Click "Open in Editor" to designate editable fields.
              </div>
            ) : (
              editableLayers.map((layer) => {
                const label = layer.editableLabel || layer.templateLabel || layer.name;
                const value = fieldValues[layer.id] ?? '';

                if (layer.type === 'text') {
                  const isLongText = (layer as TextLayer).text.length > 40;
                  return (
                    <div key={layer.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#E4E4E7', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Type size={13} style={{ color: '#0D99FF' }} />
                          <span>{label}</span>
                        </label>
                      </div>

                      {isLongText ? (
                        <textarea
                          rows={3}
                          value={value}
                          onChange={(e) =>
                            setFieldValues((prev) => ({
                              ...prev,
                              [layer.id]: e.target.value
                            }))
                          }
                          placeholder={`Enter ${label}...`}
                          style={{
                            background: '#1F1F23',
                            border: '1px solid #33333A',
                            borderRadius: 6,
                            padding: '8px 12px',
                            color: '#FFFFFF',
                            fontSize: 13,
                            outline: 'none',
                            resize: 'vertical',
                            lineHeight: 1.4
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            setFieldValues((prev) => ({
                              ...prev,
                              [layer.id]: e.target.value
                            }))
                          }
                          placeholder={`Enter ${label}...`}
                          style={{
                            background: '#1F1F23',
                            border: '1px solid #33333A',
                            borderRadius: 6,
                            padding: '8px 12px',
                            color: '#FFFFFF',
                            fontSize: 13,
                            outline: 'none'
                          }}
                        />
                      )}
                    </div>
                  );
                } else if (layer.type === 'image') {
                  return (
                    <div key={layer.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#E4E4E7', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ImageIcon size={13} style={{ color: '#E0458F' }} />
                        <span>{label}</span>
                      </label>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: '#1F1F23',
                          border: '1px solid #33333A',
                          borderRadius: 8,
                          padding: 10
                        }}
                      >
                        {/* Thumbnail of current image */}
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 6,
                            overflow: 'hidden',
                            background: '#121214',
                            border: '1px solid #3E3E48',
                            flexShrink: 0
                          }}
                        >
                          {value ? (
                            <img
                              src={value}
                              alt="Selected"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                          <input
                            type="file"
                            accept="image/*"
                            ref={(el) => (fileInputRefs.current[layer.id] = el)}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(layer.id, file);
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[layer.id]?.click()}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                background: '#2A2A30',
                                border: '1px solid #40404C',
                                borderRadius: 5,
                                color: '#FFFFFF',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Upload size={13} />
                              <span>Upload Photo</span>
                            </button>

                            <GeminiBackgroundGenerator
                              targetWidth={(layer as ImageLayer).width * (layer.scaleX || 1)}
                              targetHeight={(layer as ImageLayer).height * (layer.scaleY || 1)}
                              triggerButtonText="AI Background (Flux)"
                              onApplyImage={(generated) => {
                                setFieldValues((prev) => ({
                                  ...prev,
                                  [layer.id]: generated
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })
            )}

            {/* AI Wish Generator Tool Box */}
            <div
              style={{
                marginTop: 'auto',
                background: 'linear-gradient(135deg, rgba(13,153,255,0.08) 0%, rgba(224,69,143,0.08) 100%)',
                border: '1px dashed rgba(13,153,255,0.3)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} style={{ color: '#0D99FF' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>AI Wish Generator</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#A0A0B0', lineHeight: 1.4 }}>
                Need inspirational words for newborns, birthdays, or new joinees? Generate a heartfelt message:
              </p>
              <GeminiWishGenerator
                triggerButtonText="Generate AI Greeting / Wish"
                onApplyText={(wish: string) => {
                  // Find first editable text layer that looks like a message/wish or any text layer
                  const targetLayer = editableLayers.find((l) => {
                    const lbl = (l.editableLabel || l.templateLabel || l.name).toLowerCase();
                    return l.type === 'text' && (lbl.includes('message') || lbl.includes('wish') || lbl.includes('quote') || lbl.includes('appreciation'));
                  }) || editableLayers.find((l) => l.type === 'text');

                  if (targetLayer) {
                    setFieldValues((prev) => ({
                      ...prev,
                      [targetLayer.id]: wish
                    }));
                    if (addToast) {
                      addToast('AI Message Applied', `Pasted into "${targetLayer.editableLabel || targetLayer.name}"`, 'success');
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Right Column: Live Stage Preview */}
          <div
            style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              background: '#0D0D10',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#68D9D0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Live Stage Screen Preview
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: 'rgba(104, 217, 208, 0.15)',
                    color: '#68D9D0',
                    border: '1px solid rgba(104, 217, 208, 0.3)'
                  }}
                >
                  1080p (1920 × 1080)
                </span>
              </div>

              {pushSuccess && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(34, 197, 94, 0.18)',
                    color: '#4ADE80',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid rgba(34, 197, 94, 0.4)'
                  }}
                >
                  <Check size={14} />
                  <span>Displayed on Stage!</span>
                </div>
              )}
            </div>

            {/* 16:9 Stage Screen Frame */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#050508',
                borderRadius: 10,
                border: '1px solid #222228',
                padding: 16,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  maxHeight: '100%',
                  borderRadius: 6,
                  overflow: 'hidden',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.85)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {liveSvgMarkup ? (
                  <div
                    style={{ width: '100%', height: '100%' }}
                    dangerouslySetInnerHTML={{ __html: liveSvgMarkup }}
                  />
                ) : (
                  <div style={{ color: '#666' }}>Rendering preview...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid #26262A',
            background: '#1B1B1F'
          }}
        >
          {/* Left Actions: Create Another, Download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleCreateAnother}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#26262E',
                border: '1px solid #3E3E4C',
                borderRadius: 6,
                color: '#E0E0E0',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Reset fields to quickly create another graphic from this template (e.g. next new joinee or newborn)"
            >
              <Plus size={14} style={{ color: '#0D99FF' }} />
              <span>Create Another</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid #33333C',
                borderRadius: 6,
                color: '#A0A0B0',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export PNG</span>
            </button>
          </div>

          {/* Right Actions: Cancel, Push to Stage */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                background: 'transparent',
                border: '1px solid #33333C',
                borderRadius: 6,
                color: '#CCCCCC',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isPushing}
              onClick={handlePushToStage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 24px',
                background: pushSuccess
                  ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                  : 'linear-gradient(135deg, #0D99FF 0%, #E0458F 100%)',
                border: 'none',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: isPushing ? 'not-allowed' : 'pointer',
                boxShadow: pushSuccess
                  ? '0 4px 16px rgba(34,197,94,0.4)'
                  : '0 4px 16px rgba(13,153,255,0.4)',
                opacity: isPushing ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isPushing ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  <span>Pushing to Stage...</span>
                </>
              ) : pushSuccess ? (
                <>
                  <Check size={16} />
                  <span>Live on Stage Screen!</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>⚡ Display on Stage</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
