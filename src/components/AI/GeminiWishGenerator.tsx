import React, { useState, useId } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Copy, Check, X, AlertTriangle, RefreshCw, Wand2 } from 'lucide-react';

export interface PresetConfig {
  id: string;
  name: string;
  systemInstruction: string;
  themes: string[];
  defaultLines: number;
}

export const PRESET_CONFIGS: Record<string, PresetConfig> = {
  happy_birthday: {
    id: 'happy_birthday',
    name: 'Happy birthday',
    systemInstruction:
      'Write a cheerful, joyful 1-to-2 sentence birthday greeting celebrating another wonderful year of life, filled with happiness, health, and bright aspirations. Output ONLY the message text with no quotation marks or extra commentary.',
    themes: [
      'golden memories',
      'joyful celebrations',
      'bright new horizons',
      'laughter & cake',
      'unforgettable milestones',
      'cherished dreams',
      'radiant joy',
      'endless blessings',
      'sunshine & smiles',
      'exciting year ahead'
    ],
    defaultLines: 2
  },
  newborn: {
    id: 'newborn',
    name: 'New born',
    systemInstruction:
      "Write a warm, 1-to-2 sentence newborn baby greeting similar in tone and length to: 'Welcome to the world, little one! Wishing you a lifetime of love, laughter and endless joy.' Do not repeat that exact phrasing. Output ONLY the message text with no quotation marks or extra commentary.",
    themes: [
      'tiny footsteps',
      'new adventures',
      'warmth and cuddles',
      'starlight',
      'endless wonder',
      'gentle lullabies',
      'bright tomorrows',
      'sweet giggles',
      'pure magic',
      'cherished moments'
    ],
    defaultLines: 2
  },
  new_joinee: {
    id: 'new_joinee',
    name: 'New Joinee',
    systemInstruction:
      'Write an inspiring, warm 1-to-2 sentence welcome message for a new team member joining the company, celebrating collaboration, growth, and shared success. Output ONLY the message text with no quotation marks or extra commentary.',
    themes: [
      'fresh perspectives',
      'exciting journey',
      'team synergy',
      'innovation & growth',
      'shared milestones',
      'creative sparks',
      'welcoming family',
      'bold beginnings',
      'collaborative triumphs',
      'bright future'
    ],
    defaultLines: 2
  },
  guest_welcome: {
    id: 'guest_welcome',
    name: 'Guest welcome',
    systemInstruction:
      'Write a gracious, warm 1-to-2 sentence welcome message for an esteemed visiting guest or speaker, expressing honor and delight in hosting them. Output ONLY the message text with no quotation marks or extra commentary.',
    themes: [
      'honored presence',
      'warm hospitality',
      'cherished gathering',
      'delightful company',
      'inspiring exchanges',
      'gracious moments',
      'memorable stay',
      'open doors',
      'heartfelt reception',
      'shared joy'
    ],
    defaultLines: 2
  },
  work_anniversary: {
    id: 'work_anniversary',
    name: 'Work anniversary',
    systemInstruction:
      'Write an appreciative, inspiring 1-to-2 sentence work anniversary congratulatory message honoring dedication, accomplishments, and impactful contributions to the team. Output ONLY the message text with no quotation marks or extra commentary.',
    themes: [
      'valued dedication',
      'inspiring leadership',
      'milestone achievements',
      'team cornerstone',
      'impactful journey',
      'shared successes',
      'passion & excellence',
      'growth & innovation',
      'unwavering commitment',
      'bright milestones ahead'
    ],
    defaultLines: 2
  }
};

export interface GeminiWishGeneratorProps {
  onApplyText?: (text: string) => void;
  triggerButtonText?: string;
  className?: string;
  defaultPreset?: 'happy_birthday' | 'newborn' | 'new_joinee' | 'guest_welcome' | 'work_anniversary';
}

/**
 * Self-contained AI Text & Welcome Message Generator powered by the official @google/genai SDK.
 */
export const GeminiWishGenerator: React.FC<GeminiWishGeneratorProps> = ({
  onApplyText,
  triggerButtonText = 'Generate Text',
  className = '',
  defaultPreset = 'newborn'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset);
  const [systemInstruction, setSystemInstruction] = useState<string>(
    PRESET_CONFIGS[defaultPreset].systemInstruction
  );
  const [themesText, setThemesText] = useState<string>(
    PRESET_CONFIGS[defaultPreset].themes.join(', ')
  );
  const [maxLines, setMaxLines] = useState<number>(2);

  const [lastPickedTheme, setLastPickedTheme] = useState<string>('');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshingThemes, setIsRefreshingThemes] = useState<boolean>(false);

  const titleId = useId();

  // Switch preset
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const cfg = PRESET_CONFIGS[presetId];
    if (cfg) {
      setSystemInstruction(cfg.systemInstruction);
      setThemesText(cfg.themes.join(', '));
      setMaxLines(cfg.defaultLines);
      setErrorMessage(null);
    }
  };

  // Helper to extract API key from Vite or Process environment
  const getApiKey = (): string => {
    try {
      const stored = localStorage.getItem('cuenect_gemini_api_key');
      if (stored && stored.trim()) return stored.trim();
    } catch {}

    const key =
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) : '') ||
      '';
    return String(key).trim();
  };

  // AI Refresh Themes: Calls Gemini to generate 10 fresh, highly creative themes for this occasion
  const handleAiRefreshThemes = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setErrorMessage('Missing API Key: GEMINI_API_KEY is not defined in environment variables or .env file.');
      return;
    }

    setIsRefreshingThemes(true);
    setErrorMessage(null);

    const presetName = PRESET_CONFIGS[selectedPresetId]?.name || 'greeting';

    try {
      const ai = new GoogleGenAI({
        apiKey,
        apiVersion: 'v1beta'
      });

      const prompt = `Generate a comma-separated list of 10 fresh, poetic, highly creative and diverse themes or emotional hooks for a ${presetName} greeting message. Output ONLY the 10 comma-separated phrases with no extra commentary or numbering.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 1.0
        }
      });

      const newThemes = response.text?.trim();
      if (newThemes) {
        setThemesText(newThemes.replace(/\n/g, ', '));
      }
    } catch {
      // Fallback diverse pools if quota limit / offline
      const fallbacks: Record<string, string[]> = {
        happy_birthday: [
          'sparkling confetti, joyful memories, dreams taking flight, boundless health, golden chapter, sweet harmony, heart full of wonder, radiant year, laughter with loved ones, treasured milestones',
          'sunlit horizons, vibrant celebration, endless cake & cheer, bold new adventures, warmth & happiness, peaceful days, soaring ambition, timeless joy, starlight wishes, boundless vitality'
        ],
        newborn: [
          'tiny yawns & gentle smiles, moonlit dreams, sweetest lullaby, boundless grace, tender blessings, pure innocence, warm embraces, little miracles, blooming joy, nursery starlight',
          'soft whispers of love, angel footsteps, golden cradle, cozy cuddles, boundless affection, gentle sunrise, bright wonder, lullaby melodies, precious moments, lifelong laughter'
        ],
        new_joinee: [
          'bold journeys, visionary collaboration, fresh insights, shared horizons, spark of brilliance, unified goals, inspiring mentorship, ground-breaking ideas, passionate culture, thriving together',
          'limitless growth, creative sparks, trusted partnership, warm welcomes, dynamic team spirit, next big chapter, empowering synergy, fearless innovation, shared milestones, boundless horizons'
        ],
        guest_welcome: [
          'gracious hospitality, inspiring dialogues, warmest camaraderie, honored fellowship, memorable gatherings, open-hearted welcomes, treasured company, shared wisdom, delightful moments, enduring friendships',
          'esteemed visits, vibrant exchanges, warm open doors, meaningful connections, heartening reception, memorable fellowship, rich conversations, welcoming halls, joyful encounters, gracious harmony'
        ],
        work_anniversary: [
          'unwavering commitment, legacy of excellence, guiding light, pivotal contributions, inspiring leadership, proud milestones, celebrated loyalty, visionary milestones, dynamic impact, team pillars',
          'dedication that inspires, driving progress, cherished journey, excellence personified, impactful milestones, collaborative spirit, lasting mark, valued partnership, passion & perseverance, shining future'
        ]
      };
      const pool = fallbacks[selectedPresetId] || fallbacks.newborn;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setThemesText(pick);
    } finally {
      setIsRefreshingThemes(false);
    }
  };

  // Generate text using @google/genai SDK
  const handleGenerate = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setErrorMessage('Missing API Key: GEMINI_API_KEY is not defined in environment variables or .env file.');
      return;
    }

    // Parse themes list
    const parsedThemes = themesText
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const activeThemes =
      parsedThemes.length > 0
        ? parsedThemes
        : PRESET_CONFIGS[selectedPresetId]?.themes || ['warm welcome'];

    // Randomly select one theme
    const randomTheme = activeThemes[Math.floor(Math.random() * activeThemes.length)];
    setLastPickedTheme(randomTheme);

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Initialize official GoogleGenAI SDK with v1beta endpoint to support developer instruction & latest models
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { apiVersion: 'v1beta' }
      });

      const prompt = `Theme: ${randomTheme}. Target Length: strictly maximum ${maxLines} lines/sentences.`;

      // Primary model: gemini-2.5-flash with graceful fallback to gemini-2.5-flash-lite / gemini-3.5-flash
      const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.5-flash'];
      let resultText = '';
      let lastErr: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction.trim(),
              temperature: 0.95
            }
          });

          if (response && response.text) {
            resultText = response.text.trim();
            // Clean any unintentional outer quotation marks
            resultText = resultText.replace(/^["']|["']$/g, '');
            break;
          }
        } catch (err: any) {
          lastErr = err;
          // If model is discontinued or not found, try fallback
          const msg = String(err?.message || '');
          if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('no longer available')) {
            continue;
          }
          throw err;
        }
      }

      if (!resultText && lastErr) {
        throw lastErr;
      }

      setGeneratedText(resultText);
    } catch (err: any) {
      console.error('[GeminiWishGenerator] Error:', err);
      const msg = String(err?.message || err);

      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        setErrorMessage('Rate limit reached (HTTP 429). The Gemini API is currently throttling requests. Please wait a few seconds and try again.');
      } else if (msg.includes('403') || msg.includes('API_KEY_INVALID')) {
        setErrorMessage('Authentication Failed: The provided GEMINI_API_KEY is invalid or lacks necessary permissions.');
      } else {
        setErrorMessage(`Generation Error: ${err?.message || 'Failed to generate message from Gemini API.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard with feedback
  const handleCopy = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const ta = document.createElement('textarea');
      ta.value = generatedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        className={`btn btn-primary ${className}`}
        onClick={() => {
          setIsOpen(true);
          if (!generatedText) {
            handleGenerate();
          }
        }}
        disabled={isLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'linear-gradient(135deg, #0D99FF, #68D9D0)',
          color: '#fff',
          fontWeight: 600,
          border: 'none',
          padding: '8px 14px',
          borderRadius: 8,
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        <Sparkles size={16} />
        <span>{triggerButtonText}</span>
      </button>

      {/* Modal Popup */}
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
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            padding: 16
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              background: '#18181F',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 14,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxHeight: '90vh',
              animation: 'fadeIn 0.2s ease-out'
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
                    background: 'linear-gradient(135deg, rgba(13,153,255,0.2), rgba(104,217,208,0.2))',
                    border: '1px solid rgba(13,153,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0D99FF'
                  }}
                >
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 id={titleId} style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
                    AI Text & Wish Generator
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>
                    Official Google GenAI SDK · gemini-2.5-flash
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: '18px 20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              {/* Preset Selector & Max Lines Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                <div>
                  <label
                    htmlFor="preset-select"
                    style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#aaa', marginBottom: 6 }}
                  >
                    Greeting Preset:
                  </label>
                  <select
                    id="preset-select"
                    value={selectedPresetId}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#22222B',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      color: '#fff',
                      padding: '8px 12px',
                      fontSize: '0.88rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="happy_birthday">Happy birthday</option>
                    <option value="newborn">New born</option>
                    <option value="new_joinee">New Joinee</option>
                    <option value="guest_welcome">Guest welcome</option>
                    <option value="work_anniversary">Work anniversary</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="max-lines-input"
                    style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#aaa', marginBottom: 6 }}
                  >
                    Max Lines:
                  </label>
                  <input
                    id="max-lines-input"
                    type="number"
                    min={1}
                    max={5}
                    value={maxLines}
                    onChange={(e) => setMaxLines(Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 2)))}
                    style={{
                      width: '100%',
                      background: '#22222B',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      color: '#fff',
                      padding: '8px 12px',
                      fontSize: '0.88rem',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>

              {/* Text Box 1: System Instruction */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label
                    htmlFor="system-instruction-box"
                    style={{ fontSize: '0.78rem', fontWeight: 600, color: '#aaa' }}
                  >
                    System Instruction:
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>Tone, style, and length guidelines</span>
                </div>
                <textarea
                  id="system-instruction-box"
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#22222B',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    color: '#ddd',
                    padding: '9px 12px',
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Text Box 2: Diverse Themes */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label
                    htmlFor="diverse-themes-box"
                    style={{ fontSize: '0.78rem', fontWeight: 600, color: '#aaa' }}
                  >
                    Diverse Themes:
                  </label>
                  <button
                    type="button"
                    onClick={handleAiRefreshThemes}
                    disabled={isRefreshingThemes || isLoading}
                    title="Generate fresh, diverse themes with AI"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(13, 153, 255, 0.15)',
                      border: '1px solid rgba(13, 153, 255, 0.35)',
                      color: '#0D99FF',
                      borderRadius: 5,
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: isRefreshingThemes ? 'wait' : 'pointer'
                    }}
                  >
                    <Wand2 size={11} className={isRefreshingThemes ? 'animate-spin' : ''} />
                    <span>{isRefreshingThemes ? 'Refreshing...' : 'AI Refresh Themes'}</span>
                  </button>
                </div>
                <textarea
                  id="diverse-themes-box"
                  value={themesText}
                  onChange={(e) => setThemesText(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    background: '#22222B',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    color: '#ddd',
                    padding: '9px 12px',
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    color: '#FB7185',
                    fontSize: '0.8rem',
                    lineHeight: 1.4
                  }}
                >
                  <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>{errorMessage}</div>
                  {errorMessage.includes('GEMINI_API_KEY') && (
                    <button
                      type="button"
                      onClick={() => {
                        const entered = window.prompt('Enter your Google Gemini API Key:');
                        if (entered && entered.trim()) {
                          try {
                            localStorage.setItem('cuenect_gemini_api_key', entered.trim());
                          } catch {}
                          setErrorMessage(null);
                          handleGenerate();
                        }
                      }}
                      style={{
                        padding: '3px 8px',
                        background: '#F43F5E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      Enter Key
                    </button>
                  )}
                </div>
              )}

              {/* Preview Box */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label
                    htmlFor="preview-box-content"
                    style={{ fontSize: '0.78rem', fontWeight: 600, color: '#aaa', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Generated Wish Preview</span>
                    {lastPickedTheme && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(13,153,255,0.15)',
                          color: '#0D99FF',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontWeight: 500
                        }}
                      >
                        🎲 Theme: {lastPickedTheme}
                      </span>
                    )}
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>Max {maxLines} lines</span>
                </div>

                <div
                  id="preview-box-content"
                  style={{
                    background: '#141419',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    minHeight: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: generatedText ? 'flex-start' : 'center',
                    color: generatedText ? '#fff' : '#666',
                    fontSize: '0.94rem',
                    lineHeight: 1.55,
                    fontStyle: generatedText ? 'normal' : 'italic',
                    position: 'relative'
                  }}
                >
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0D99FF' }}>
                      <RefreshCw size={18} className="spin" />
                      <span>Consulting Gemini for a unique heartfelt wish...</span>
                    </div>
                  ) : generatedText ? (
                    generatedText
                  ) : (
                    'Click "Generate New Wish" to create your first personalized greeting.'
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
                padding: '14px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              {/* Copy to Clipboard */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!generatedText || isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.08)',
                  border: copied ? '1px solid #22C55E' : '1px solid rgba(255,255,255,0.15)',
                  color: copied ? '#22C55E' : '#ddd',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  cursor: !generatedText || isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {onApplyText && generatedText && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyText(generatedText);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.84rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Insert to Canvas
                  </button>
                )}

                {/* Main Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 18px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #0D99FF, #68D9D0)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(13, 153, 255, 0.3)'
                  }}
                >
                  {isLoading ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
                  <span>{isLoading ? 'Generating...' : 'Generate New Wish'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
