import React, { useEffect, useState, useRef } from 'react';
import { LottieSvg } from 'lottie-react';

export interface LottieAnimationProps {
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
  onComplete?: () => void;
  speed?: number;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  animationData,
  loop = false,
  autoplay = true,
  size = 24,
  width,
  height,
  className = '',
  style,
  fallback = null,
  onComplete,
  speed = 1
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  });

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Performance safeguard: when looping, only run when visible in viewport
  useEffect(() => {
    if (!loop || typeof IntersectionObserver === 'undefined') return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry?.isIntersecting ?? true);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loop]);

  const w = width ?? size;
  const h = height ?? size;

  if (prefersReducedMotion) {
    return <>{fallback}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`lottie-wrapper ${className}`}
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style
      }}
    >
      {isVisible ? (
        <LottieSvg
          src={animationData}
          loop={loop}
          autoplay={autoplay}
          speed={speed}
          subscriptions={onComplete ? { complete: onComplete } : undefined}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
};
