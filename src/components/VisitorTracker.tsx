'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get or initialize persistent visitor ID
    let visitorId = localStorage.getItem('asv_vid');
    if (!visitorId) {
      visitorId = 'vid_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('asv_vid', visitorId);
    }

    const getDevice = (): 'desktop' | 'mobile' | 'tablet' => {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    };

    const trackPage = (path: string) => {
      try {
        const payload = JSON.stringify({
          visitorId,
          path,
          device: getDevice(),
          referrer: document.referrer || '',
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/track', payload);
        } else {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch (err) {}
    };

    // Track on path change
    if (lastTrackedPath.current !== pathname) {
      lastTrackedPath.current = pathname;
      trackPage(pathname);
    }

    // Heartbeat every 2 minutes for active session status
    const interval = setInterval(() => {
      trackPage(pathname);
    }, 120000);

    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
