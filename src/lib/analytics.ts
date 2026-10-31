import fs from 'fs';
import path from 'path';

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalViews: number;
  uniqueVisitors: number;
  visitors: string[]; // List of visitorIds seen this day
  loggedInUsers?: string[]; // List of userIds active this day
  hourlyViews: number[]; // Array of 24 numbers
  topPages: Record<string, number>; // path -> count
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
}

export interface RecentVisitItem {
  id: string;
  visitorId: string;
  userId?: string;
  username?: string;
  email?: string;
  ip?: string;
  path: string;
  device: string;
  time: string;
}

export interface ActiveSessionItem {
  visitorId: string;
  userId?: string;
  username?: string;
  email?: string;
  ip?: string;
  path: string;
  device: string;
  secondsAgo: number;
  isLoggedIn: boolean;
}

export interface AnalyticsSchema {
  dailySummaries: Record<string, DailySummary>; // date -> DailySummary
  recentVisits: RecentVisitItem[];
  totalAllTimeViews: number;
  totalAllTimeUnique: number;
  allTimeVisitorIds: string[];
}

export interface VisitorStats {
  todayUnique: number;
  todayLoggedInUnique: number;
  todayViews: number;
  activeNow: number;
  loggedInOnlineCount: number;
  guestOnlineCount: number;
  activeSessions: ActiveSessionItem[];
  totalAllTimeViews: number;
  totalAllTimeUnique: number;
  hourly: number[];
  dailyHistory7d: {
    date: string;
    label: string;
    views: number;
    unique: number;
    loggedIn: number;
  }[];
  topPages: { path: string; count: number }[];
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  recentVisits: RecentVisitItem[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const TMP_ANALYTICS_FILE = path.join('/tmp', 'analytics.json');

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

interface ActivePing {
  lastActive: number;
  path: string;
  device: string;
  userId?: string;
  username?: string;
  email?: string;
  ip?: string;
}

class AnalyticsManager {
  private cache: AnalyticsSchema | null = null;
  private activePings: Map<string, ActivePing> = new Map();

  private initAnalytics(): AnalyticsSchema {
    // 1. First check /tmp on serverless (latest runtime writes)
    if (fs.existsSync(TMP_ANALYTICS_FILE)) {
      try {
        const raw = fs.readFileSync(TMP_ANALYTICS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.dailySummaries) return parsed;
      } catch {}
    }

    // 2. Check project data/analytics.json
    if (fs.existsSync(ANALYTICS_FILE)) {
      try {
        const raw = fs.readFileSync(ANALYTICS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.dailySummaries) return parsed;
      } catch (err) {
        console.error('Error reading analytics.json, initializing fresh store:', err);
      }
    }

    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }

    const today = getVietnamDate();
    return {
      dailySummaries: {
        [today]: {
          date: today,
          totalViews: 0,
          uniqueVisitors: 0,
          visitors: [],
          loggedInUsers: [],
          hourlyViews: Array(24).fill(0),
          topPages: {},
          deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
        },
      },
      recentVisits: [],
      totalAllTimeViews: 0,
      totalAllTimeUnique: 0,
      allTimeVisitorIds: [],
    };
  }

  private getStore(): AnalyticsSchema {
    if (!this.cache) {
      this.cache = this.initAnalytics();
    }
    return this.cache;
  }

  private saveStore() {
    if (!this.cache) return;
    const raw = JSON.stringify(this.cache, null, 2);
    // Write to /tmp first (always succeeds on Vercel serverless)
    try {
      fs.writeFileSync(TMP_ANALYTICS_FILE, raw, 'utf8');
    } catch {}
    // Try writing to local data/analytics.json (for local dev)
    try {
      fs.writeFileSync(ANALYTICS_FILE, raw, 'utf8');
    } catch {}
  }

  public recordVisit(params: {
    visitorId: string;
    path: string;
    device?: 'desktop' | 'mobile' | 'tablet';
    referrer?: string;
    userId?: string;
    username?: string;
    email?: string;
    ip?: string;
  }): { success: boolean; activeNow: number; todayUnique: number } {
    const store = this.getStore();
    const now = new Date();
    const today = getVietnamDate(now);
    const hour = getVietnamHour(now);
    const timeStr = getVietnamTimeStr(now);

    const visitorId = params.visitorId || 'anon_' + Math.random().toString(36).substring(2, 8);
    const pathName = params.path || '/';
    const device = params.device || 'desktop';
    const cleanIp = params.ip ? params.ip.split(',')[0].trim() : undefined;

    // 1. Update in-memory active pings (Active in last 5 minutes)
    const prevPing = this.activePings.get(visitorId);
    this.activePings.set(visitorId, {
      lastActive: Date.now(),
      path: pathName,
      device,
      userId: params.userId || prevPing?.userId,
      username: params.username || prevPing?.username,
      email: params.email || prevPing?.email,
      ip: cleanIp || prevPing?.ip,
    });

    // 2. Ensure daily summary exists for today
    if (!store.dailySummaries[today]) {
      store.dailySummaries[today] = {
        date: today,
        totalViews: 0,
        uniqueVisitors: 0,
        visitors: [],
        loggedInUsers: [],
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

    // Track logged-in unique customer today
    if (!day.loggedInUsers) day.loggedInUsers = [];
    if (params.userId && !day.loggedInUsers.includes(params.userId)) {
      day.loggedInUsers.push(params.userId);
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

    // Recent visits log (keep top 60)
    if (!store.recentVisits) store.recentVisits = [];
    const maskedVid =
      visitorId.length > 8 ? visitorId.substring(0, 4) + '***' + visitorId.slice(-4) : visitorId;
    store.recentVisits.unshift({
      id: 'vst_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      visitorId: maskedVid,
      userId: params.userId,
      username: params.username,
      email: params.email,
      ip: cleanIp,
      path: pathName,
      device,
      time: timeStr,
    });

    if (store.recentVisits.length > 60) {
      store.recentVisits = store.recentVisits.slice(0, 60);
    }

    this.saveStore();

    const activeSessions = this.getActiveSessions();
    return {
      success: true,
      activeNow: Math.max(1, activeSessions.length),
      todayUnique: day.uniqueVisitors,
    };
  }

  public getActiveSessions(): ActiveSessionItem[] {
    const now = Date.now();
    const cutoff = now - 5 * 60 * 1000; // 5 minutes window
    const sessions: ActiveSessionItem[] = [];

    this.activePings.forEach((val, key) => {
      if (val.lastActive >= cutoff) {
        const maskedVid = key.length > 8 ? key.substring(0, 4) + '***' + key.slice(-4) : key;
        sessions.push({
          visitorId: maskedVid,
          userId: val.userId,
          username: val.username,
          email: val.email,
          ip: val.ip,
          path: val.path,
          device: val.device,
          secondsAgo: Math.max(0, Math.round((now - val.lastActive) / 1000)),
          isLoggedIn: Boolean(val.userId || val.username),
        });
      } else {
        this.activePings.delete(key);
      }
    });

    sessions.sort((a, b) => a.secondsAgo - b.secondsAgo);
    return sessions;
  }

  public getActiveNowCount(): number {
    return Math.max(1, this.getActiveSessions().length);
  }

  public getStats(): VisitorStats {
    const store = this.getStore();
    const today = getVietnamDate();
    const day = store.dailySummaries[today] || {
      date: today,
      totalViews: 0,
      uniqueVisitors: 0,
      visitors: [],
      loggedInUsers: [],
      hourlyViews: Array(24).fill(0),
      topPages: {},
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    };

    const topPagesArray: { path: string; count: number }[] = Object.entries(day.topPages || {})
      .map(([pagePath, count]) => ({ path: pagePath, count: Number(count) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const activeSessions = this.getActiveSessions();
    const loggedInOnlineCount = activeSessions.filter((s) => s.isLoggedIn).length;
    const guestOnlineCount = Math.max(0, activeSessions.length - loggedInOnlineCount);
    const activeNow = Math.max(1, activeSessions.length);

    // Build 7-day daily history
    const dailyHistory7d: VisitorStats['dailyHistory7d'] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = getVietnamDate(d);
      const parts = dateStr.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
      const summary = store.dailySummaries[dateStr];
      dailyHistory7d.push({
        date: dateStr,
        label,
        views: summary?.totalViews || 0,
        unique: summary?.uniqueVisitors || 0,
        loggedIn: summary?.loggedInUsers?.length || 0,
      });
    }

    return {
      todayUnique: day.uniqueVisitors,
      todayLoggedInUnique: day.loggedInUsers?.length || 0,
      todayViews: day.totalViews,
      activeNow,
      loggedInOnlineCount,
      guestOnlineCount,
      activeSessions: activeSessions.slice(0, 40),
      totalAllTimeViews: Math.max(store.totalAllTimeViews, day.totalViews),
      totalAllTimeUnique: Math.max(store.totalAllTimeUnique, day.uniqueVisitors),
      hourly: day.hourlyViews || Array(24).fill(0),
      dailyHistory7d,
      topPages: topPagesArray,
      deviceBreakdown: day.deviceBreakdown || { desktop: 0, mobile: 0, tablet: 0 },
      recentVisits: (store.recentVisits || []).slice(0, 25),
    };
  }

  public simulateTestVisit(pathName: string = '/'): VisitorStats {
    const randomId = 'test_' + Math.random().toString(36).substring(2, 9);
    const devices: ('desktop' | 'mobile' | 'tablet')[] = ['desktop', 'mobile', 'tablet'];
    const device = devices[Math.floor(Math.random() * devices.length)];
    this.recordVisit({ visitorId: randomId, path: pathName, device });
    return this.getStats();
  }
}

const globalForAnalytics = global as unknown as { analyticsManager?: AnalyticsManager };
export const analytics = new AnalyticsManager();
if (globalForAnalytics.analyticsManager) {
  if ((globalForAnalytics.analyticsManager as any).cache) {
    (analytics as any).cache = (globalForAnalytics.analyticsManager as any).cache;
  }
  if ((globalForAnalytics.analyticsManager as any).activePings) {
    (analytics as any).activePings = (globalForAnalytics.analyticsManager as any).activePings;
  }
}
globalForAnalytics.analyticsManager = analytics;
