import { useEffect, useState } from 'react';

// Desktop layout from the Figma desktop mockup (1440 × 1024 frame) kicks in on wide windows.
export const DESKTOP_QUERY = '(min-width: 900px)';

export function useIsDesktop() {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(DESKTOP_QUERY).matches;
  const [desktop, setDesktop] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const on = () => setDesktop(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return desktop;
}
