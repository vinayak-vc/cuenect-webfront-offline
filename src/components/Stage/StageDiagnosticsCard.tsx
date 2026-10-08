import React, { useEffect, useState } from 'react';
import { useStage } from '../../context/StageContext';

/** A report older than this is shown as stale rather than as live numbers (the stage reports every 2 s). */
const STALE_AFTER_MS = 7000;

type Tone = 'good' | 'warn' | 'bad' | 'neutral';

const TONE_COLOURS: Record<Tone, string> = {
  good: '#3ddc97',
  warn: '#ffaa00',
  bad: '#ff5c5c',
  neutral: 'var(--text-primary)'
};

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

/**
 * Live health of the stage (B-015): frame rate, frame time, the round trip to the stage, the graphics device and what it is
 * running. Everything shown was measured on the stage and sent to us; nothing here is estimated. A report that stops
 * arriving is labelled stale instead of being left on screen as if it were current.
 */
export const StageDiagnosticsCard: React.FC = () => {
  const { stageDiagnostics, stageLatencyMs } = useStage();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!stageDiagnostics) {
    return (
      <div className="u-card" style={{ padding: '10px 12px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
        Stage health: waiting for the stage to report. Older stage builds do not send it.
      </div>
    );
  }

  const d = stageDiagnostics;
  const stale = now - d.receivedAt > STALE_AFTER_MS;
  const fpsTone: Tone = stale ? 'neutral' : d.fps >= 55 ? 'good' : d.fps >= 30 ? 'warn' : 'bad';
  const latencyTone: Tone = stageLatencyMs === null ? 'neutral' : stageLatencyMs < 60 ? 'good' : stageLatencyMs < 200 ? 'warn' : 'bad';

  const cells: Array<{ label: string; value: string; tone?: Tone }> = [
    { label: 'Frame rate', value: `${d.fps.toFixed(0)} fps`, tone: fpsTone },
    { label: 'Frame time', value: `${d.frameMs.toFixed(1)} ms (worst ${d.worstFrameMs.toFixed(0)})` },
    { label: 'Latency', value: stageLatencyMs === null ? '—' : `${stageLatencyMs} ms`, tone: latencyTone },
    { label: 'Resolution', value: `${d.width} × ${d.height}` },
    { label: 'Display mode', value: d.displayMode || '—' },
    { label: 'Quality tier', value: d.qualityTier || '—' },
    { label: 'Memory', value: `${d.memoryMb} MB` },
    { label: 'Running for', value: formatUptime(d.uptimeSeconds) }
  ];

  return (
    <div
      aria-label="Stage health"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-1)',
        border: '1px solid var(--line-subtle)',
        opacity: stale ? 0.6 : 1
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>Stage health</strong>
        <span style={{ fontSize: '0.68rem', color: stale ? '#ffaa00' : 'var(--text-secondary)' }}>
          {stale ? 'no report for a while' : 'live'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
        {cells.map((cell) => (
          <div key={cell.label} style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '0.64rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {cell.label}
            </span>
            <span style={{ display: 'block', fontSize: '0.8rem', fontFamily: 'monospace', color: TONE_COLOURS[cell.tone ?? 'neutral'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cell.value}
            </span>
          </div>
        ))}
      </div>

      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
        {d.gpu || 'Unknown GPU'} · {d.graphicsApi || 'unknown API'}
        {d.version ? ` · stage ${d.version}` : ''}
      </span>
    </div>
  );
};
