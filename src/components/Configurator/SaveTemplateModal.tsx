import React, { useState } from 'react';
import { ConfiguratorProject } from './types';
import { X, CheckCircle2, Download, Save } from 'lucide-react';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ConfiguratorProject;
  onSavePermanent: (updatedTitle: string) => void;
  onSaveDraft: (triggerDownload: boolean) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  project,
  onSavePermanent,
  onSaveDraft
}) => {
  const [title, setTitle] = useState(project.title || 'Untitled Occasion Template');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.78)',
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
          maxWidth: 520,
          background: '#16161D',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0D99FF 0%, #68D9D0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF'
              }}
            >
              <Save size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                Save Occasion Template
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: '#888899' }}>
                Choose whether to update the permanent default or save a temporary draft
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              borderRadius: 4
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Template Title Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#AAAAAA' }}>
              Template Name / Occasion Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Baby Born Celebration (Option 1)"
              style={{
                background: '#22222A',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                padding: '9px 12px',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Option 1: Save Permanent Default */}
          <div
            onClick={() => onSavePermanent(title)}
            style={{
              background: 'rgba(13, 153, 255, 0.08)',
              border: '1.5px solid #0D99FF',
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(13, 153, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(13, 153, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#0D99FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                flexShrink: 0,
                marginTop: 2
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                  Make it Permanent (Default for Occasion)
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: '#0D99FF',
                    color: '#FFF'
                  }}
                >
                  RECOMMENDED
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#A0A0B8', lineHeight: 1.45 }}>
                Saves this design directly into the default occasion template. Whenever you go to{' '}
                <strong style={{ color: '#FFF' }}>Homepage → Templates</strong> and select this template, it will
                permanently show your updated layout and editable fields ready for stage display.
              </p>
            </div>
          </div>

          {/* Option 2: Save Draft & Download JSON */}
          <div
            onClick={() => onSaveDraft(true)}
            style={{
              background: '#1F1F28',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#2B2B38',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#AAA',
                flexShrink: 0,
                marginTop: 2
              }}
            >
              <Download size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#DDDDDD' }}>
                Save Temporary Draft & Download JSON
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#888899', lineHeight: 1.45 }}>
                Saves locally as a draft in your browser and downloads a standalone .cuenect-project.json backup file.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#BBB',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
