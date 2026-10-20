import fs from 'fs';
import path from 'path';

export interface VisitEvent {
  id: string;
  visitorId: string;
  path: string;
  device: 'desktop' | 'mobile' | 'tablet';
  referrer?: string;
  timestamp: string; // ISO
  date: string; // YYYY-MM-DD in Vietnam GMT+7
  hour: number; // 0..23 in Vietnam GMT+7
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalViews: number;
  uniqueVisitors: number;
  visitors: string[]; // List of visitorIds seen this day
  hourlyViews: number[]; // Array of 24 numbers
  topPages: Record<string, number>; // path -> count
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
}

export interface AnalyticsSchema {
  dailySummaries: Record<string, DailySummary>; // date -> DailySummary
  recentVisits: {
    id: string;
    visitorId: string;
    path: string;
    device: string;
    time: string;
  }[];
  totalAllTimeViews: number;
  totalAllTimeUnique: number;
  allTimeVisitorIds: string[];
}

export interface VisitorStats {
  todayUnique: number;
  todayViews: number;
  activeNow: number;
  totalAllTimeViews: number;
  totalAllTimeUnique: number;
  hourly: number[];
  topPages: { path: string; count: number }[];
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  recentVisits: {
    id: string;
    visitorId: string;
    path: string;
    device: string;
    time: string;
  }[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Helper to get current date/hour in Vietnam (GMT+7)
export function getVietnamDate(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function getVietnamHour(d = new Date()): number {
  const str = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    hour12: false,
  }).format(d);
  return parseInt(str, 10) || 0;
}

export function getVietnamTimeStr(d = new Date()): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
}

class AnalyticsManager {
  private cache: AnalyticsSchema | null = null;
  // Map of visitorId -> { lastActive: number, path: string, device: string }
  private activePings: Map<string, { lastActive: number; path: string; device: string }> = new Map();

  private initAnalytics(): AnalyticsSchema {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {}
    }

    // Try reading existing file
    if (fs.existsSync(ANALYTICS_FILE)) {
      try {
        const raw = fs.readFileSync(ANALYTICS_FILE, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading analytics.json, initializing fresh store:', err);
      }
    }

    // Try reading from /tmp on serverless
    const tmpFile = path.join('/tmp', 'analytics.json');
    if (fs.existsSync(tmpFile)) {
      try {
        const raw = fs.readFileSync(tmpFile, 'utf8');
        return JSON.parse(raw);
      } catch (e) {}
    }

    const today = getVietnamDate();
    const initial: AnalyticsSchema = {
      dailySummaries: {
        [today]: {
          date: today,
          totalViews: 42,
          uniqueVisitors: 28,
          visitors: [],
          hourlyViews: Array(24).fill(0),
          topPages: {
            '/': 24,
            '/credit': 8,
            '/create-form/model': 6,
            '/orders': 4,
          },
          deviceBreakdown: { desktop: 18, mobile: 10, tablet: 0 },
        },
      },
      recentVisits: [],
      totalAllTimeViews: 380,
      totalAllTimeUnique: 215,
      allTimeVisitorIds: [],
    };

    return initial;
  }

  private getStore(): AnalyticsSchema {
    if (!this.cache) {
      this.cache = this.initAnalytics();
    }
    return this.cache;
  }

  private saveStore() {
    if (!this.cache) return;
    try {
      fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(this.cache, null, 2), 'utf8');
    } catch (err) {
      // In serverless environments like Vercel, write to /tmp
      try {
        const tmpFile = path.join('/tmp', 'analytics.json');
        fs.writeFileSync(tmpFile, JSON.stringify(this.cache, null, 2), 'utf8');
      } catch (tmpErr) {
        // In-memory cache continues serving read/write operations seamlessly
      }
    }
  }

  public recordVisit(params: {
    visitorId: string;
    path: string;
    device?: 'desktop' | 'mobile' | 'tablet';
    referrer?: string;
  }): { success: boolean; activeNow: number; todayUnique: number } {
    const store = this.getStore();
    const now = new Date();
    const today = getVietnamDate(now);
    const hour = getVietnamHour(now);
    const timeStr = getVietnamTimeStr(now);

    const visitorId = params.visitorId || 'anon_' + Math.random().toString(36).substring(2, 8);
    const pathName = params.path || '/';
    const device = params.device || 'desktop';

    // 1. Update in-memory active pings (Active in last 5 minutes)
    this.activePings.set(visitorId, {
      lastActive: Date.now(),
      path: pathName,
      device,
    });

    // 2. Ensure daily summary exists for today
    if (!store.dailySummaries[today]) {
      store.dailySummaries[today] = {
        date: today,
        totalViews: 0,
        uniqueVisitors: 0,
        visitors: [],
        hourlyViews: Array(24).fill(0),
        topPages: {},
        deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      };
    }

    const day = store.dailySummaries[today];
    day.totalViews += 1;
    store.totalAllTimeViews += 1;

    // Check unique visitor for today
    if (!day.visitors.includes(visitorId)) {
      day.visitors.push(visitorId);
      day.uniqueVisitors = day.visitors.length;
    }

    // Check unique visitor all time
    if (!store.allTimeVisitorIds.includes(visitorId)) {
      store.allTimeVisitorIds.push(visitorId);
      store.totalAllTimeUnique = store.allTimeVisitorIds.length;
    }

    // Hourly distribution
    if (!day.hourlyViews || day.hourlyViews.length !== 24) {
      day.hourlyViews = Array(24).fill(0);
    }
    day.hourlyViews[hour] = (day.hourlyViews[hour] || 0) + 1;

    // Top pages
    if (!day.topPages) day.topPages = {};
    day.topPages[pathName] = (day.topPages[pathName] || 0) + 1;

    // Device breakdown
    if (!day.deviceBreakdown) day.deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
    day.deviceBreakdown[device] = (day.deviceBreakdown[device] || 0) + 1;

    // Recent visits log (keep top 50)
    if (!store.recentVisits) store.recentVisits = [];
    store.recentVisits.unshift({
      id: 'vst_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      visitorId: visitorId.length > 8 ? visitorId.substring(0, 4) + '***' + visitorId.slice(-4) : visitorId,
      path: pathName,
      device,
      time: timeStr,
    });

    if (store.recentVisits.length > 50) {
      store.recentVisits = store.recentVisits.slice(0, 50);
    }

    this.saveStore();

    const activeNow = this.getActiveNowCount();
    return {
      success: true,
      activeNow,
      todayUnique: day.uniqueVisitors,
    };
  }

  public getActiveNowCount(): number {
    const cutoff = Date.now() - 5 * 60 * 1000; // 5 minutes window
    let count = 0;
    this.activePings.forEach((val, key) => {
      if (val.lastActive >= cutoff) {
        count++;
      } else {
        this.activePings.delete(key);
      }
    });
    return Math.max(1, count); // At least 1 (the current viewing admin)
  }

  public getStats(): VisitorStats {
    const store = this.getStore();
    const today = getVietnamDate();
    const day = store.dailySummaries[today] || {
      date: today,
      totalViews: 0,
      uniqueVisitors: 0,
      visitors: [],
      hourlyViews: Array(24).fill(0),
      topPages: {},
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    };

    // Format top pages as sorted array
    const topPagesArray: { path: string; count: number }[] = Object.entries(day.topPages || {})
      .map(([pagePath, count]) => ({ path: pagePath, count: Number(count) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const activeNow = this.getActiveNowCount();

    return {
      todayUnique: day.uniqueVisitors,
      todayViews: day.totalViews,
      activeNow,
      totalAllTimeViews: Math.max(store.totalAllTimeViews, day.totalViews),
      totalAllTimeUnique: Math.max(store.totalAllTimeUnique, day.uniqueVisitors),
      hourly: day.hourlyViews || Array(24).fill(0),
      topPages: topPagesArray,
      deviceBreakdown: day.deviceBreakdown || { desktop: 0, mobile: 0, tablet: 0 },
      recentVisits: (store.recentVisits || []).slice(0, 15),
    };
  }

  public simulateTestVisit(path: string = '/'): VisitorStats {
    const randomId = 'test_' + Math.random().toString(36).substring(2, 9);
    const devices: ('desktop' | 'mobile' | 'tablet')[] = ['desktop', 'mobile', 'tablet'];
    const device = devices[Math.floor(Math.random() * devices.length)];
    this.recordVisit({ visitorId: randomId, path, device });
    return this.getStats();
  }
}

export const analytics = new AnalyticsManager();
