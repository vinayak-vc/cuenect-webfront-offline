import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Platform-adaptive container: a swipe-dismissable bottom sheet on mobile,
 * a centred dialog on tablet/desktop (handled entirely in CSS so there is one
 * component and one behaviour tree).
 *
 * Dismissal: backdrop click, Escape, close button, or swipe down past a
 * threshold. Swiping is additive - every sheet still has a visible close
 * control, so nothing depends on gesture recognition succeeding.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Reset any residual drag when the sheet reopens.
  useEffect(() => {
    if (isOpen) setDragOffset(0);
  }, [isOpen]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only start a drag from the grabber / header area.
    dragStartY.current = e.clientY;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  }, []);

  const onPointerUp = useCallback(() => {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    // ~110px of travel reads as a deliberate dismissal.
    if (dragOffset > 110) {
      onClose();
    }
    setDragOffset(0);
  }, [dragOffset, onClose]);

  if (!isOpen) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={dragOffset ? { transform: `translateY(${dragOffset}px)`, animation: 'none' } : undefined}
      >
        <div
          className="sheet-grabber"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        <div
          className="sheet-header"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div style={{ minWidth: 0 }}>
            <div className="sheet-title u-truncate">{title}</div>
            {subtitle && <div className="u-meta u-truncate">{subtitle}</div>}
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={`Close ${title}`}>
            <X size={18} />
          </button>
        </div>

        <div className="sheet-body">{children}</div>

        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>
  );
};
