'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // 1. Capture referral code from URL (?ref=CODE) and persist for 30 days
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref') || urlParams.get('referral');
        if (ref && ref.trim()) {
          const cleanRef = ref.trim().toUpperCase();
          try {
            localStorage.setItem('asv_ref', cleanRef);
          } catch {}
          document.cookie = `asv_ref=${encodeURIComponent(cleanRef)}; path=/; max-age=2592000; SameSite=Lax`;
        }
      } catch (e) {}

      // 2. Get or initialize persistent visitor ID
      let visitorId = 'vid_anon';
      try {
        const stored = localStorage.getItem('asv_vid');
        if (stored) {
          visitorId = stored;
        } else {
          visitorId = 'vid_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
          localStorage.setItem('asv_vid', visitorId);
        }
      } catch {}

      const getDevice = (): 'desktop' | 'mobile' | 'tablet' => {
        try {
          const width = window.innerWidth;
          if (width < 768) return 'mobile';
          if (width < 1024) return 'tablet';
        } catch {}
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

          if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
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
    } catch (topErr) {
      console.warn('Visitor tracking error:', topErr);
    }
  }, [pathname]);

  return null;
}
