import React, { useState, useId, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, X, AlertTriangle, RefreshCw, Wand2, Check, Cpu } from 'lucide-react';
import { stageSocket } from '../../services/socketService';

export interface OccasionOption {
  id: string;
  name: string;
  promptTerm: string;
}

export const OCCASIONS: OccasionOption[] = [
  { id: 'newborn', name: 'New born', promptTerm: 'newborn baby announcement' },
  { id: 'happy_birthday', name: 'Happy birthday', promptTerm: 'birthday celebration' },
  { id: 'new_joinee', name: 'New Joinee', promptTerm: 'welcome new team member' },
  { id: 'guest_welcome', name: 'Guest welcome', promptTerm: 'honored guest welcome' },
  { id: 'work_anniversary', name: 'Work anniversary', promptTerm: 'work anniversary milestone' }
];

/**
 * Occasion-tailored Visual Style Presets:
 * Updates dynamically based on the selected Occasion type.
 */
export const BACKGROUND_STYLES_BY_OCCASION: Record<string, string[]> = {
  newborn: [
    'Soft Pastel & Minimalist Nursery Doodles',
    'Dreamy Watercolor Clouds & Golden Stars',
    'Whimsical Pastel Toys & Teddy Balloons',
    'Modern Soft Mint & Peach Geometric'
  ],
  happy_birthday: [
    'Vibrant Pastel Confetti & Golden Sparkles',
    'Dreamy Floating Balloons & Festive Banners',
    'Minimalist Elegant Watercolor Cake & Ribbons',
    'Retro Pastel Pop & Party Streamers'
  ],
  new_joinee: [
    'Modern Mint & Gold Geometric Network',
    'Clean Corporate Gradient & Isometric Shapes',
    'Minimalist Tech Grid & Soft Cyan Waves',
    'Inspiring Architectural Lines & Subtle Gradients'
  ],
  work_anniversary: [
    'Sophisticated Gold & Platinum Star Dust',
    'Elegant Deep Navy & Champagne Laurel Leaves',
    'Minimalist Milestone Trophy & Geometric Ribbons',
    'Prestigious Pastel Bokeh & Golden Rays'
  ],
  guest_welcome: [
    'Warm Botanical Foliage & Delicate Florals',
    'Classic Hospitality Watercolor & Ornate Border',
    'Serene Terracotta & Olive Branch Frame',
    'Prestigious Marble & Gold Accent Trim'
  ]
};

export const BACKGROUND_STYLES = BACKGROUND_STYLES_BY_OCCASION.newborn;

export type SupportedAspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

/**
 * Calculates the closest supported aspect ratio string for display and layout
 */
export function getClosestAspectRatio(w: number, h: number): SupportedAspectRatio {
  if (!w || !h) return '1:1';
  const ratio = w / h;
  const options: { id: SupportedAspectRatio; val: number }[] = [
    { id: '1:1', val: 1 },
    { id: '4:3', val: 4 / 3 },
    { id: '3:4', val: 3 / 4 },
    { id: '16:9', val: 16 / 9 },
    { id: '9:16', val: 9 / 16 }
  ];
  options.sort((a, b) => Math.abs(ratio - a.val) - Math.abs(ratio - b.val));
  return options[0].id;
}

/**
 * Cleanly crops and scales an image to match the exact target width & height bounding box
 * using offscreen canvas with object-fit: cover logic (zero layout distortion).
 */
async function resizeToExactBoundingBox(imageUri: string, targetW: number, targetH: number): Promise<string> {
  if (!targetW || !targetH) return imageUri;

  return new Promise((resolve) => {
    const img = new Image();
    if (imageUri && !imageUri.startsWith('data:') && !imageUri.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(targetW);
      canvas.height = Math.round(targetH);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageUri);

      // Object-fit: cover math
      const imgRatio = img.width / img.height;
      const targetRatio = targetW / targetH;
      let renderW = targetW;
      let renderH = targetH;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > targetRatio) {
        renderW = targetH * imgRatio;
        offsetX = -(renderW - targetW) / 2;
      } else {
        renderH = targetW / imgRatio;
        offsetY = -(renderH - targetH) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => resolve(imageUri);
    img.src = imageUri;
  });
}

/**
 * Generates an SVG fallback pastel background matching target dimensions & aspect ratio
 */
function createFallbackPastelBackground(w: number, h: number, _style: string, occasion: string): string {
  const c1 = occasion === 'newborn' ? '#FFF3F8' : occasion === 'happy_birthday' ? '#FFF8E7' : occasion === 'work_anniversary' ? '#F7F3FE' : '#F0F9FF';
  const c2 = occasion === 'newborn' ? '#F4E8FF' : occasion === 'happy_birthday' ? '#FFE8F0' : occasion === 'work_anniversary' ? '#FFFBEB' : '#E8F5E9';
  const accent = occasion === 'newborn' ? '#FF6FB1' : occasion === 'happy_birthday' ? '#FFA726' : occasion === 'work_anniversary' ? '#D97706' : '#0D99FF';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
      <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="2.5" fill="${accent}" opacity="0.18" />
        <circle cx="5" cy="5" r="1.5" fill="${accent}" opacity="0.12" />
        <circle cx="35" cy="10" r="1.8" fill="${accent}" opacity="0.15" />
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)" />
    <rect width="${w}" height="${h}" fill="url(#dots)" />
    <rect x="${w * 0.05}" y="${h * 0.05}" width="${w * 0.9}" height="${h * 0.9}" rx="24" fill="none" stroke="${accent}" stroke-width="2.5" stroke-dasharray="8 6" opacity="0.3" />
    <rect x="${w * 0.12}" y="${h * 0.12}" width="${w * 0.76}" height="${h * 0.76}" rx="18" fill="#FFFFFF" opacity="0.65" />
    <circle cx="${w * 0.08}" cy="${h * 0.08}" r="${Math.min(w, h) * 0.04}" fill="${accent}" opacity="0.25" />
    <circle cx="${w * 0.92}" cy="${h * 0.08}" r="${Math.min(w, h) * 0.04}" fill="${accent}" opacity="0.25" />
    <circle cx="${w * 0.08}" cy="${h * 0.92}" r="${Math.min(w, h) * 0.04}" fill="${accent}" opacity="0.25" />
    <circle cx="${w * 0.92}" cy="${h * 0.92}" r="${Math.min(w, h) * 0.04}" fill="${accent}" opacity="0.25" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface GeminiBackgroundGeneratorProps {
  targetWidth: number;
  targetHeight: number;
  onApplyImage?: (imageSrc: string) => void;
  triggerButtonText?: string;
  className?: string;
}

export const GeminiBackgroundGenerator: React.FC<GeminiBackgroundGeneratorProps> = ({
  targetWidth = 400,
  targetHeight = 400,
  onApplyImage,
  triggerButtonText = 'Generate New Background',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('newborn');

  // Available styles dynamically updated based on occasion type
  const availableStyles = useMemo(() => {
    return BACKGROUND_STYLES_BY_OCCASION[selectedOccasionId] || BACKGROUND_STYLES_BY_OCCASION.newborn;
  }, [selectedOccasionId]);

  const [selectedStyle, setSelectedStyle] = useState<string>(availableStyles[0]);
  const [promptText, setPromptText] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRewritingPrompt, setIsRewritingPrompt] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generationSource, setGenerationSource] = useState<string>('');

  const titleId = useId();

  // Keep selectedStyle aligned with current occasion's available styles
  useEffect(() => {
    if (!availableStyles.includes(selectedStyle)) {
      setSelectedStyle(availableStyles[0]);
    }
  }, [availableStyles, selectedStyle]);

  // Dynamic Aspect Ratio and Orientation description
  const closestAspectRatio = useMemo(() => {
    return getClosestAspectRatio(targetWidth, targetHeight);
  }, [targetWidth, targetHeight]);

  const orientationDescription = useMemo(() => {
    const ratio = targetWidth / (targetHeight || 1);
    if (ratio > 1.2) {
      return `landscape frame (approx ${Math.round(targetWidth)}x${Math.round(targetHeight)}, aspect ratio ~${ratio.toFixed(2)}:1)`;
    } else if (ratio < 0.8) {
      return `vertical portrait frame (approx ${Math.round(targetWidth)}x${Math.round(targetHeight)}, aspect ratio ~1:${(1 / ratio).toFixed(2)})`;
    } else {
      return `square frame (approx ${Math.round(targetWidth)}x${Math.round(targetHeight)}, 1:1 aspect ratio)`;
    }
  }, [targetWidth, targetHeight]);

  // Construct default theme-matched background prompt
  const defaultPrompt = useCallback((occId: string, style: string, orientationDesc: string) => {
    const occ = OCCASIONS.find((o) => o.id === occId) || OCCASIONS[0];
    return `A soft, pastel ${occ.promptTerm} card background in ${style}, composed for a ${orientationDesc}, with subtle hand-drawn minimalist decorations around the outer edges and a large, clean, uncluttered blank space in the center for text and overlays. Flat vector illustration style. Strictly no text, no letters, no numbers, no faces, and no people.`;
  }, []);

  // Update prompt whenever occasion, style, or orientation changes
  useEffect(() => {
    setPromptText(defaultPrompt(selectedOccasionId, selectedStyle, orientationDescription));
  }, [selectedOccasionId, selectedStyle, orientationDescription, defaultPrompt]);

  // Helper to extract Cloudflare & Gemini credentials
  const getEnvVar = (keys: string[]): string => {
    const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
    const procEnv = typeof process !== 'undefined' ? (process as any).env : undefined;
    for (const k of keys) {
      const val = metaEnv?.[k] || procEnv?.[k];
      if (val) return String(val).trim();
    }
    return '';
  };

  const getGeminiApiKey = (): string => {
    return getEnvVar(['VITE_GEMINI_API_KEY', 'GEMINI_API_KEY']);
  };

  const getCloudflareConfig = () => {
    const accountId = getEnvVar(['VITE_CF_ACCOUNT_ID', 'CF_ACCOUNT_ID']);
    const apiToken = getEnvVar(['VITE_CF_API_TOKEN', 'CF_API_TOKEN']);
    return { accountId, apiToken };
  };

  // Small Text AI Generate Button: Calls Gemini to creatively rewrite/update the background prompt
  const handleAiRewritePrompt = async () => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setErrorMessage('Missing API Key: GEMINI_API_KEY is not defined in environment variables or .env file.');
      return;
    }

    setIsRewritingPrompt(true);
    setErrorMessage(null);

    const occ = OCCASIONS.find((o) => o.id === selectedOccasionId) || OCCASIONS[0];

    try {
      const ai = new GoogleGenAI({
        apiKey,
        apiVersion: 'v1beta'
      });

      const instruction = `Generate a single detailed, creative, aesthetic prompt for an AI image generator (@cf/black-forest-labs/flux-1-schnell) to create a pastel background for a ${occ.name} announcement card. Style: ${selectedStyle}. Frame orientation: ${orientationDescription}. Requirements: soft pastel palette, subtle border doodles or botanical decorations along edges, wide clean empty blank center for typography. Strictly no text, no letters, no numbers, no faces, and no people. Output ONLY the prompt text in 2-3 sentences.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: instruction,
        config: {
          temperature: 0.95
        }
      });

      const generated = response.text?.trim();
      if (generated) {
        setPromptText(generated);
      }
    } catch {
      // Offline / fallback creative prompts
      const randomElements = ['soft lavender sprinkles', 'golden starlight speckles', 'delicate mint leaves', 'dreamy watercolor washes', 'whimsical clouds & balloons'];
      const pick = randomElements[Math.floor(Math.random() * randomElements.length)];
      setPromptText(
        `A gentle, pastel ${occ.promptTerm} card background in ${selectedStyle}, composed for a ${orientationDescription}, featuring delicate ${pick} along the borders, with a serene, spacious, pristine blank center for custom overlays. Clean flat vector illustration. Strictly no text, no numbers, and no faces.`
      );
    } finally {
      setIsRewritingPrompt(false);
    }
  };

  // Generate Image via Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell)
  const handleGenerateImage = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setGenerationSource('');

    const finalPrompt = promptText || defaultPrompt(selectedOccasionId, selectedStyle, orientationDescription);
    const { accountId, apiToken } = getCloudflareConfig();

    let generatedDataUri: string | null = null;
    let sourceLabel = '';

    try {
      // 1. Cloudflare REST API via Cuenect Server (/api/ai/generate-flux)
      try {
        const baseUrl = stageSocket?.getHttpBaseUrl() || '';
        const endpoint = baseUrl ? `${baseUrl}/api/ai/generate-flux` : '/api/ai/generate-flux';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            width: Math.round(targetWidth),
            height: Math.round(targetHeight),
            steps: 4,
            accountId,
            apiToken
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.dataURI) {
            generatedDataUri = data.dataURI;
            sourceLabel = 'Cuenect Server (Cloudflare REST API Flux-1)';
          }
        }
      } catch (proxyErr) {
        console.warn('Cuenect server endpoint failed, trying direct Cloudflare REST API fallback:', proxyErr);
      }

      // 2. Direct Cloudflare REST API fallback (using accountId & apiToken)
      if (!generatedDataUri && accountId && apiToken) {
        try {
          const directUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
          const res = await fetch(directUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: finalPrompt,
              steps: 4
            })
          });

          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const json = await res.json();
              if (json.dataURI) {
                generatedDataUri = json.dataURI;
              } else if (json.result && json.result.image) {
                generatedDataUri = `data:image/jpeg;base64,${json.result.image}`;
              } else if (json.image) {
                generatedDataUri = `data:image/jpeg;base64,${json.image}`;
              }
            } else {
              // Binary JPEG stream
              const blob = await res.blob();
              generatedDataUri = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            }
            if (generatedDataUri) {
              sourceLabel = 'Direct Cloudflare REST API (Flux-1-Schnell)';
            }
          } else {
            const errText = await res.text();
            throw new Error(`Cloudflare API HTTP ${res.status}: ${errText}`);
          }
        } catch (directErr: any) {
          console.warn('Direct Cloudflare API call error:', directErr);
          throw directErr;
        }
      }

      if (generatedDataUri) {
        // Cleanly scale and crop image to match exact element bounding box (object-fit: cover)
        const fittedUri = await resizeToExactBoundingBox(generatedDataUri, targetWidth, targetHeight);
        setPreviewImage(fittedUri);
        setGenerationSource(sourceLabel);
      } else {
        throw new Error('Unable to connect to Cloudflare Workers AI proxy or REST API.');
      }
    } catch (err: any) {
      console.warn('Flux generation fallback warning:', err);

      let msg = err.message || 'Error communicating with Cloudflare Workers AI';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('neuron')) {
        msg = 'Cloudflare Daily Neuron Quota: Daily limit reached or network error. A matching procedural pastel vector background is provided below!';
      }
      setErrorMessage(msg);

      // Provide seamless matching background preview so user workflow is never blocked
      const fallback = createFallbackPastelBackground(targetWidth, targetHeight, selectedStyle, selectedOccasionId);
      setPreviewImage(fallback);
      setGenerationSource('Pastel Vector Procedural Engine (Fallback)');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply to Element
  const handleApply = () => {
    if (previewImage && onApplyImage) {
      onApplyImage(previewImage);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button - Rendered directly below Replace Photo */}
      <button
        type="button"
        className={className}
        onClick={() => {
          setIsOpen(true);
          if (!previewImage) {
            handleGenerateImage();
          }
        }}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'linear-gradient(135deg, #F38020 0%, #0D99FF 100%)',
          color: '#FFFFFF',
          fontWeight: 600,
          border: 'none',
          padding: '10px 14px',
          borderRadius: 6,
          fontSize: 13,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 10px rgba(243, 128, 32, 0.3)',
          marginTop: 6
        }}
      >
        <Sparkles size={14} />
        <span>{triggerButtonText}</span>
      </button>

      {/* Preview Modal Popup (Identical UX to Wish Generator) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(6px)',
            padding: 16
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 700,
              background: '#18181F',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 14,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxHeight: '92vh'
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
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #F38020, #0D99FF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(243,128,32,0.35)'
                  }}
                >
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 id={titleId} style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                    Generate Background (Cloudflare Workers AI)
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#999' }}>
                    Model: <b>@cf/black-forest-labs/flux-1-schnell</b> • Target: {Math.round(targetWidth)} × {Math.round(targetHeight)}px ({closestAspectRatio})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 6
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Controls Row: Occasion & Style Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#aaa', marginBottom: 5 }}>
                    Occasion Preset:
                  </label>
                  <select
                    value={selectedOccasionId}
                    onChange={(e) => setSelectedOccasionId(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#22222B',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      color: '#fff',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ.id} value={occ.id}>
                        {occ.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#aaa', marginBottom: 5 }}>
                    Visual Style Preset (Occasion-Matched):
                  </label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#22222B',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      color: '#fff',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {availableStyles.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prompt Text Box with Small Text AI Generate Button */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#aaa' }}>
                    Flux-1 Background Prompt ({orientationDescription}):
                  </label>
                  <button
                    type="button"
                    onClick={handleAiRewritePrompt}
                    disabled={isRewritingPrompt || isLoading}
                    title="Generate a unique, creative background prompt variation with Gemini AI"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(243, 128, 32, 0.15)',
                      border: '1px solid rgba(243, 128, 32, 0.35)',
                      color: '#F97316',
                      borderRadius: 5,
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: isRewritingPrompt ? 'wait' : 'pointer'
                    }}
                  >
                    <Wand2 size={11} className={isRewritingPrompt ? 'animate-spin' : ''} />
                    <span>{isRewritingPrompt ? 'Rewriting...' : 'AI Rewrite Prompt'}</span>
                  </button>
                </div>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#22222B',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    color: '#ddd',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    lineHeight: 1.4,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Non-intrusive Status / Quota Alert */}
              {errorMessage && (
                <div
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: 8,
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    color: '#FDA4AF',
                    fontSize: '0.78rem',
                    lineHeight: 1.4
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Preview Box Matching Target Aspect Ratio */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#aaa' }}>
                    Generated Background Preview:
                  </label>
                  {generationSource && (
                    <span style={{ fontSize: '0.72rem', color: '#68D9D0' }}>
                      ⚡ {generationSource}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 240,
                    background: '#0F0F14',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#F38020' }}>
                      <RefreshCw size={28} className="animate-spin" />
                      <span style={{ fontSize: '0.82rem', color: '#aaa' }}>
                        Rendering with Cloudflare Workers AI (@cf/black-forest-labs/flux-1-schnell)...
                      </span>
                    </div>
                  ) : previewImage ? (
                    <div
                      style={{
                        height: '100%',
                        aspectRatio: `${targetWidth} / ${targetHeight}`,
                        position: 'relative',
                        boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
                        borderRadius: 6,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={previewImage}
                        alt="AI Background Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: '#666' }}>No background generated yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#2B2B36',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '7px 12px',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>Regenerate (Flux)</span>
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#aaa',
                    padding: '7px 14px',
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!previewImage || isLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'linear-gradient(135deg, #0D99FF 0%, #0077CC 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 16px',
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: !previewImage || isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(13,153,255,0.4)'
                  }}
                >
                  <Check size={14} />
                  <span>Apply to Element</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
