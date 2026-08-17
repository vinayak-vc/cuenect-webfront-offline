import { useEffect } from 'react';

// Prevents the underlying page (and whatever list/grid sits in it) from
// scrolling while a full-screen overlay or modal is open. Without this,
// wheel/touch scroll chains from the overlay's own scroll container through
// to `document.body`, and the content behind the overlay visibly scrolls.
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
