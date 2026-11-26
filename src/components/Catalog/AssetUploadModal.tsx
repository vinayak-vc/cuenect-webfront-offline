import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Link,
  Box,
  Video,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Play,
  Trash2,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { useStage } from '../../context/StageContext';
import { stageSocket } from '../../services/socketService';
import { AssetInformation } from '../../types/protocol';

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfigurator?: () => void;
}

type TabType = 'upload' | 'url' | 'manage';

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
  isOpen,
  onClose,
  onOpenConfigurator
}) => {
  const { assets, loadAsset, addToast } = useStage();
  const [activeTab, setActiveTab] = useState<TabType>('upload');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumb, setSelectedThumb] = useState<File | null>(null);
  const [assetName, setAssetName] = useState<string>('');
  const [playlistName, setPlaylistName] = useState<string>('');
  const [loadImmediately, setLoadImmediately] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // URL Import State
  const [remoteUrl, setRemoteUrl] = useState<string>('');
  const [remoteAssetName, setRemoteAssetName] = useState<string>('');
  const [remotePlaylist, setRemotePlaylist] = useState<string>('');
  const [remoteCategory, setRemoteCategory] = useState<number>(-1);
  const [isDownloadingUrl, setIsDownloadingUrl] = useState<boolean>(false);
  const [urlDownloadProgress, setUrlDownloadProgress] = useState<number>(0);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Deletion State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Detect category from file extension
  const detectCategory = (filename: string): { category: number; label: string; icon: any } => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['glb', 'gltf', 'fbx', 'obj'].includes(ext)) {
      return { category: 0, label: '3D Model', icon: Box };
    }
    if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) {
      return { category: 2, label: 'Video', icon: Video };
    }
    return { category: 1, label: 'Image', icon: ImageIcon };
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setAssetName(nameWithoutExt.replace(/[-_]/g, ' '));

    const detected = detectCategory(file.name);
    if (!playlistName) {
      if (detected.category === 0) setPlaylistName('3D Models');
      else if (detected.category === 2) setPlaylistName('Videos');
      else setPlaylistName('Images');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Perform Local File Upload to Node Server
  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      setUploadProgress(30);
      const fileData = await readFileAsBase64(selectedFile);
      let thumbnailData = '';
      if (selectedThumb) {
        thumbnailData = await readFileAsBase64(selectedThumb);
      }

      setUploadProgress(60);
      const baseUrl = stageSocket.getHttpBaseUrl();
      const detected = detectCategory(selectedFile.name);

      const payload = {
        fileName: selectedFile.name,
        fileData,
        assetName: assetName.trim() || selectedFile.name,
        playlistName: playlistName.trim() || 'General',
        category: detected.category,
        thumbnailData,
        loadImmediately
      };

      setUploadProgress(85);
      const res = await fetch(`${baseUrl}/api/assets/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Upload failed');
      }

      await res.json();
      setUploadProgress(100);
      addToast(
        'Asset Uploaded Successfully',
        `"${payload.assetName}" was saved to stage library and registered.`,
        'success'
      );

      // Reset
      setSelectedFile(null);
      setSelectedThumb(null);
      setAssetName('');
      setIsUploading(false);
      onClose();
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || 'Failed to upload asset');
      addToast('Upload Failed', err.message || 'Error occurred', 'error');
    }
  };

  // Perform Remote URL Import via Node Server Downloader
  const handleUrlSubmit = async () => {
    if (!remoteUrl.trim()) return;
    setIsDownloadingUrl(true);
    setUrlDownloadProgress(15);
    setUrlError(null);

    try {
      const baseUrl = stageSocket.getHttpBaseUrl();
      const payload = {
        url: remoteUrl.trim(),
        assetName: remoteAssetName.trim() || undefined,
        playlistName: remotePlaylist.trim() || undefined,
        category: remoteCategory >= 0 ? remoteCategory : undefined,
        loadImmediately
      };

      const res = await fetch(`${baseUrl}/api/assets/download-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Download request failed' }));
        throw new Error(errJson.error || 'Server failed to download asset from URL');
      }

      setUrlDownloadProgress(100);
      addToast(
        'Remote Asset Imported',
        `Asset downloaded and synchronized to stage library.`,
        'success'
      );

      setRemoteUrl('');
      setRemoteAssetName('');
      setIsDownloadingUrl(false);
      onClose();
    } catch (err: any) {
      setIsDownloadingUrl(false);
      setUrlError(err.message || 'Download failed');
      addToast('Import Failed', err.message || 'Error occurred', 'error');
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (asset: AssetInformation) => {
    if (!confirm(`Delete "${asset.AssetName}" from the stage library?`)) return;
    setDeletingId(asset.AssetID);
    try {
      const baseUrl = stageSocket.getHttpBaseUrl();
      const res = await fetch(`${baseUrl}/api/assets/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ assetId: asset.AssetID, deleteFile: true })
      });
      if (!res.ok) throw new Error('Delete failed');
      addToast('Asset Removed', `"${asset.AssetName}" was removed from database.`, 'info');
    } catch (err: any) {
      addToast('Deletion Failed', err.message || 'Could not delete asset', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const detectedCurrent = selectedFile ? detectCategory(selectedFile.name) : null;
  const DetectedIcon = detectedCurrent?.icon || Box;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading && !isDownloadingUrl) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#F8FAFC'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(30, 41, 59, 0.5), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(13, 153, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0D99FF'
              }}
            >
              <HardDrive size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Library Asset Manager</h2>
              <p style={{ fontSize: '0.72rem', color: '#94A3B8', margin: 0 }}>
                Upload models, videos & graphics directly to the stage storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading || isDownloadingUrl}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0 20px',
            gap: 20
          }}
        >
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '2px solid #0D99FF' : '2px solid transparent',
              color: activeTab === 'upload' ? '#0D99FF' : '#94A3B8',
              fontWeight: activeTab === 'upload' ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Upload size={15} />
            <span>Local File Upload (LAN)</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'url' ? '2px solid #0D99FF' : '2px solid transparent',
              color: activeTab === 'url' ? '#0D99FF' : '#94A3B8',
              fontWeight: activeTab === 'url' ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Link size={15} />
            <span>Remote URL Downloader</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'manage' ? '2px solid #0D99FF' : '2px solid transparent',
              color: activeTab === 'manage' ? '#0D99FF' : '#94A3B8',
              fontWeight: activeTab === 'manage' ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Box size={15} />
            <span>Manage Library ({assets.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: LOCAL FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Drag & Drop Zone */}
              {!selectedFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: 12,
                    padding: '36px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'rgba(30, 41, 59, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0D99FF';
                    e.currentTarget.style.backgroundColor = 'rgba(13, 153, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.3)';
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".glb,.gltf,.fbx,.obj,.mp4,.mov,.webm,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'rgba(13, 153, 255, 0.1)',
                      color: '#0D99FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto'
                    }}
                  >
                    <Upload size={24} />
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                    Choose a file or drag & drop here
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 12 }}>
                    Supports 3D Models (.glb, .gltf, .fbx, .obj), Videos (.mp4, .mov), and Images (.png, .jpg)
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      gap: 8,
                      alignItems: 'center',
                      fontSize: '0.7rem',
                      color: '#64748B',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '4px 10px',
                      borderRadius: 20
                    }}
                  >
                    <span>⚡ Automatically copied to Unity Stage persistent data path</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'rgba(13, 153, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0D99FF'
                      }}
                    >
                      <DetectedIcon size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{selectedFile.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span style={{ color: '#0D99FF', fontWeight: 600 }}>{detectedCurrent?.label}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: 6
                    }}
                    title="Remove selected file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Asset Details Form */}
              {selectedFile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                      Asset Display Name
                    </label>
                    <input
                      type="text"
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      placeholder="e.g. Vintage Car Model"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#F8FAFC',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                      Playlist / Collection
                    </label>
                    <input
                      type="text"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      placeholder="e.g. Highlights"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#F8FAFC',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  {/* Optional Custom Thumbnail (especially for 3D models or videos) */}
                  {detectedCurrent?.category !== 1 && (
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                        Custom Thumbnail Image (Optional)
                      </label>
                      <input
                        type="file"
                        ref={thumbInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedThumb(e.target.files[0]);
                          }
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => thumbInputRef.current?.click()}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#F8FAFC',
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          {selectedThumb ? 'Change Thumbnail' : 'Choose Thumbnail...'}
                        </button>
                        {selectedThumb && (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{selectedThumb.name}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Immediate Load Toggle */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      marginTop: 4,
                      fontSize: '0.82rem',
                      userSelect: 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={loadImmediately}
                      onChange={(e) => setLoadImmediately(e.target.checked)}
                      style={{ accentColor: '#0D99FF', width: 16, height: 16 }}
                    />
                    <span>⚡ Immediately project onto Unity Hologram Stage</span>
                  </label>

                  {/* Progress bar */}
                  {isUploading && (
                    <div style={{ marginTop: 8 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.72rem',
                          color: '#94A3B8',
                          marginBottom: 4
                        }}
                      >
                        <span>Transferring to stage host...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          background: 'rgba(255, 255, 255, 0.1)',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${uploadProgress}%`,
                            background: 'linear-gradient(90deg, #0D99FF, #68D9D0)',
                            transition: 'width 0.2s ease'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#FCA5A5',
                        fontSize: '0.78rem',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center'
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REMOTE URL DOWNLOADER */}
          {activeTab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  background: 'rgba(13, 153, 255, 0.08)',
                  border: '1px solid rgba(13, 153, 255, 0.2)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: '0.78rem',
                  color: '#93C5FD',
                  lineHeight: 1.4
                }}
              >
                🌐 <strong>Cloud & Remote Download:</strong> The Node server downloads and stores the asset directly
                into the host machine's library storage, bypassing browser CORS restrictions and automatically
                registering it for Unity.
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                  Remote Asset URL
                </label>
                <input
                  type="url"
                  value={remoteUrl}
                  onChange={(e) => {
                    setRemoteUrl(e.target.value);
                    if (!remoteAssetName && e.target.value) {
                      try {
                        const pathName = new URL(e.target.value).pathname;
                        const last = pathName.split('/').pop() || '';
                        setRemoteAssetName(last.split('.')[0] || '');
                      } catch {}
                    }
                  }}
                  placeholder="https://example.com/assets/robot.glb"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#F8FAFC',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                  Asset Name
                </label>
                <input
                  type="text"
                  value={remoteAssetName}
                  onChange={(e) => setRemoteAssetName(e.target.value)}
                  placeholder="e.g. Robot Model"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#F8FAFC',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                    Asset Type
                  </label>
                  <select
                    value={remoteCategory}
                    onChange={(e) => setRemoteCategory(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#F8FAFC',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value={-1}>Auto-detect from extension</option>
                    <option value={0}>3D Model (.glb, .gltf, .fbx, .obj)</option>
                    <option value={2}>Video (.mp4, .mov)</option>
                    <option value={1}>Image (.png, .jpg)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 4, display: 'block' }}>
                    Playlist
                  </label>
                  <input
                    type="text"
                    value={remotePlaylist}
                    onChange={(e) => setRemotePlaylist(e.target.value)}
                    placeholder="e.g. Internet Downloads"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#F8FAFC',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  marginTop: 4,
                  fontSize: '0.82rem',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={loadImmediately}
                  onChange={(e) => setLoadImmediately(e.target.checked)}
                  style={{ accentColor: '#0D99FF', width: 16, height: 16 }}
                />
                <span>⚡ Immediately project onto Unity Hologram Stage</span>
              </label>

              {isDownloadingUrl && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: '#94A3B8',
                      marginBottom: 4
                    }}
                  >
                    <span>Node server streaming asset from URL...</span>
                    <span>{urlDownloadProgress}%</span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${urlDownloadProgress}%`,
                        background: 'linear-gradient(90deg, #0D99FF, #68D9D0)',
                        transition: 'width 0.2s ease'
                      }}
                    />
                  </div>
                </div>
              )}

              {urlError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#FCA5A5',
                    fontSize: '0.78rem',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{urlError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANAGE ASSETS QUICK LIST */}
          {activeTab === 'manage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: 4 }}>
                Currently registered items in the Cuenect Stage Database:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {assets.map((asset) => {
                  const isDeleting = deletingId === asset.AssetID;
                  return (
                    <div
                      key={asset.AssetID}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 8
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {asset.Category === 0 ? (
                            <Box size={16} color="#0D99FF" />
                          ) : asset.Category === 2 ? (
                            <Video size={16} color="#A855F7" />
                          ) : (
                            <ImageIcon size={16} color="#EC4899" />
                          )}
                        </div>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{asset.AssetName}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                            {asset.PlaylistName || 'General'} • {asset.fileSizeMB ? `${asset.fileSizeMB} MB` : 'Local'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => {
                            loadAsset(asset);
                            onClose();
                          }}
                          title="Project immediately onto stage"
                          style={{
                            padding: '5px 10px',
                            background: 'rgba(13, 153, 255, 0.15)',
                            border: '1px solid rgba(13, 153, 255, 0.3)',
                            borderRadius: 6,
                            color: '#0D99FF',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Play size={12} />
                          <span>Push</span>
                        </button>

                        <button
                          onClick={() => handleDeleteAsset(asset)}
                          disabled={isDeleting}
                          title="Delete from library"
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            borderRadius: 6
                          }}
                        >
                          {isDeleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.95)'
          }}
        >
          {onOpenConfigurator ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenConfigurator();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#68D9D0',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Sparkles size={14} />
              <span>Or design with Image Studio</span>
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading || isDownloadingUrl}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            {activeTab === 'upload' && selectedFile && (
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isUploading}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0D99FF, #0077CC)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isUploading ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
                <span>{isUploading ? 'Uploading...' : 'Save & Register'}</span>
              </button>
            )}

            {activeTab === 'url' && (
              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={isDownloadingUrl || !remoteUrl.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0D99FF, #0077CC)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isDownloadingUrl || !remoteUrl.trim() ? 'not-allowed' : 'pointer',
                  opacity: !remoteUrl.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isDownloadingUrl ? <Loader2 size={15} className="spin" /> : <Link size={15} />}
                <span>{isDownloadingUrl ? 'Downloading...' : 'Import from URL'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
