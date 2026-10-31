'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Megaphone, X, Sparkles, AlertTriangle } from 'lucide-react';

interface AnnouncementBanner {
  enabled: boolean;
  text: string;
  type: 'info' | 'promo' | 'warning';
  linkText?: string;
  linkUrl?: string;
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState<AnnouncementBanner | null>(null);
  const [dismissedText, setDismissedText] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedDismiss = sessionStorage.getItem('asv_dismissed_banner');
      if (savedDismiss) setDismissedText(savedDismiss);
    } catch {}
  }, []);

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
      } catch {}

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
          let userId: string | undefined;
          let username: string | undefined;
          let email: string | undefined;
          let token: string | null = null;

          try {
            token = localStorage.getItem('autosurvey_token');
            const rawUser = localStorage.getItem('autosurvey_user');
            if (rawUser) {
              const parsed = JSON.parse(rawUser);
              userId = parsed?.id;
              username = parsed?.username;
              email = parsed?.email;
            }
          } catch {}

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const payload = JSON.stringify({
            visitorId,
            path,
            device: getDevice(),
            referrer: document.referrer || '',
            userId,
            username,
            email,
          });

          fetch('/api/analytics/track', {
            method: 'POST',
            headers,
            body: payload,
            keepalive: true,
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.announcement) {
                setAnnouncement(data.announcement);
              }
            })
            .catch(() => {});
        } catch {}
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

  const hideOnAuthPages = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  if (
    hideOnAuthPages ||
    !announcement ||
    !announcement.enabled ||
    !announcement.text?.trim() ||
    dismissedText === announcement.text
  ) {
    return null;
  }

  const bannerTheme =
    announcement.type === 'warning'
      ? 'bg-amber-600 text-white border-amber-500'
      : announcement.type === 'promo'
      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-purple-500'
      : 'bg-blue-600 text-white border-blue-500';

  return (
    <div className={`relative z-50 w-full border-b px-4 py-2 text-xs sm:text-sm font-medium shadow-sm ${bannerTheme}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {announcement.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : announcement.type === 'promo' ? (
            <Sparkles className="w-4 h-4 shrink-0" />
          ) : (
            <Megaphone className="w-4 h-4 shrink-0" />
          )}
          <span className="truncate sm:whitespace-normal">{announcement.text}</span>
          {announcement.linkUrl && (
            <Link
              href={announcement.linkUrl}
              className="shrink-0 underline font-bold hover:opacity-90 ml-1"
            >
              {announcement.linkText || 'Xem ngay →'}
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissedText(announcement.text);
            try {
              sessionStorage.setItem('asv_dismissed_banner', announcement.text);
            } catch {}
          }}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
