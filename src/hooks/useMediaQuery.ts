import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query from React.
 *
 * Used to pick between platform interaction models (bottom sheet vs dialog,
 * bottom nav vs header nav) without duplicating business logic.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Mobile-first breakpoint: below the tablet threshold. */
export const useIsMobile = (): boolean => useMediaQuery('(max-width: 767px)');

/** Desktop: enough width for multi-column layouts and header search. */
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 1024px)');
