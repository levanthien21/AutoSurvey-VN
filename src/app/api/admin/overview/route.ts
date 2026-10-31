import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { orderManager } from '@/lib/orderStore';
import { analytics, getVietnamDate } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await Promise.all([db.syncFromBlob(), orderManager.syncFromBlob()]);

  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Không có quyền truy cập quản trị' },
      { status: 403 }
    );
  }

  const users = db.getAllUsers();
  const transactions = db.getAllTransactions();
  const orders = orderManager.getAllOrders();
  const coupons = db.getCoupons();
  const loginHistory = db.getLoginHistory();
  const auditLogs = db.getAuditLogs();
  const settings = db.getSettings();
  const visitorStats = analytics.getStats();

  const nowMs = Date.now();
  const todayVN = getVietnamDate(new Date(nowMs));
  const currentMonthPrefix = todayVN.slice(0, 7); // YYYY-MM
  const sevenDaysAgo = nowMs - 7 * 86400000;
  const thirtyDaysAgo = nowMs - 30 * 86400000;

  // --- Per-User Order & Financial Aggregation ---
  const userOrderStats = new Map<
    string,
    { ordersCount: number; runningOrdersCount: number; submittedCount: number }
  >();
  for (const o of orders) {
    const key = o.userId || (o.userEmail ? `email:${o.userEmail.toLowerCase()}` : '');
    if (!key) continue;
    const prev = userOrderStats.get(key) || {
      ordersCount: 0,
      runningOrdersCount: 0,
      submittedCount: 0,
    };
    prev.ordersCount += 1;
    if (o.status === 'running' || o.status === 'pending') prev.runningOrdersCount += 1;
    prev.submittedCount += o.completedCount || 0;
    userOrderStats.set(key, prev);
  }

  const userFinanceStats = new Map<string, { totalDeposited: number; totalSpent: number }>();
  for (const t of transactions) {
    if (t.status !== 'completed') continue;
    const prev = userFinanceStats.get(t.userId) || { totalDeposited: 0, totalSpent: 0 };
    if (t.type === 'deposit') prev.totalDeposited += t.amount || 0;
    if (t.type === 'order_charge') prev.totalSpent += Math.abs(t.credits || t.amount || 0);
    userFinanceStats.set(t.userId, prev);
  }

  // --- Registration & Account Metrics ---
  const customerUsers = users.filter((u) => u.role !== 'admin');
  const adminUsersCount = users.length - customerUsers.length;
  const vipUsersCount = users.filter((u) => u.status === 'vip').length;
  const bannedUsersCount = users.filter((u) => u.status === 'banned').length;
  const googleUsersCount = users.filter(
    (u) => u.authProvider === 'google' || u.authProvider === 'firebase' || Boolean(u.googleId)
  ).length;
  const localUsersCount = Math.max(0, users.length - googleUsersCount);

  let newUsersToday = 0;
  let newUsers7d = 0;
  let newUsers30d = 0;
  let activeUsers7d = 0;
  let everLoggedInCount = 0;

  for (const u of users) {
    const createdMs = u.createdAt ? new Date(u.createdAt).getTime() : 0;
    if (createdMs > 0) {
      if (getVietnamDate(new Date(createdMs)) === todayVN) newUsersToday++;
      if (createdMs >= sevenDaysAgo) newUsers7d++;
      if (createdMs >= thirtyDaysAgo) newUsers30d++;
    }

    const lastActiveStr = u.lastActiveAt || u.lastLoginAt;
    if (lastActiveStr) {
      everLoggedInCount++;
      if (new Date(lastActiveStr).getTime() >= sevenDaysAgo) {
        activeUsers7d++;
      }
    } else if ((u.loginCount || 0) > 0) {
      everLoggedInCount++;
    }
  }

  // --- Login Intelligence Today ---
  const todayLoginEvents = loginHistory.filter(
    (e) => e.timestamp && getVietnamDate(new Date(e.timestamp)) === todayVN
  );
  const uniqueLoggedInTodaySet = new Set<string>(todayLoginEvents.map((e) => e.userId));
  // Also include users whose lastActiveAt or lastLoginAt is today
  for (const u of users) {
    const ts = u.lastActiveAt || u.lastLoginAt;
    if (ts && getVietnamDate(new Date(ts)) === todayVN) {
      uniqueLoggedInTodaySet.add(u.id);
    }
  }
  const loggedInTodayUnique = Math.max(
    uniqueLoggedInTodaySet.size,
    visitorStats.todayLoggedInUnique || 0
  );

  // --- Financial Metrics ---
  const completedDeposits = transactions.filter(
    (t) => t.type === 'deposit' && t.status === 'completed'
  );
  const totalRevenue = completedDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);
  const revenueToday = completedDeposits
    .filter((t) => t.createdAt && getVietnamDate(new Date(t.createdAt)) === todayVN)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const revenueThisMonth = completedDeposits
    .filter((t) => t.createdAt && getVietnamDate(new Date(t.createdAt)).startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Strictly sum customer credits (excluding Admin 999,999,999 infinite balances)
  const totalCreditsInCirculation = customerUsers.reduce((sum, u) => sum + (u.credits || 0), 0);
  const totalCreditsSpent = transactions
    .filter((t) => t.type === 'order_charge' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.credits || t.amount || 0), 0);

  const pendingDeposits = transactions.filter(
    (t) => t.type === 'deposit' && t.status === 'pending'
  );
  const pendingDepositsAmount = pendingDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);

  // --- Orders Metrics ---
  const runningOrdersCount = orders.filter(
    (o) => o.status === 'running' || o.status === 'pending'
  ).length;
  const pausedOrdersCount = orders.filter((o) => o.status === 'paused').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledOrdersCount = orders.filter(
    (o) => o.status === 'cancelled' || o.status === 'failed'
  ).length;
  const totalSubmitted = orders.reduce((sum, o) => sum + (o.completedCount || 0), 0);
  const totalTargetResponses = orders.reduce((sum, o) => sum + (o.totalTarget || 0), 0);
  const totalSuccessResponses = orders.reduce((sum, o) => sum + (o.successCount || 0), 0);
  const totalErrorResponses = orders.reduce((sum, o) => sum + (o.errorCount || 0), 0);

  // --- Conversion Funnel ---
  const usersWithOrdersSet = new Set<string>();
  for (const o of orders) {
    if (o.userId) usersWithOrdersSet.add(o.userId);
  }
  const depositingUsersSet = new Set<string>(completedDeposits.map((t) => t.userId));

  // --- Affiliate Metrics ---
  const allReferrals = db.getAllReferrals();
  const totalAffiliateCommissions = users.reduce(
    (sum, u) => sum + (u.affiliateEarnings || 0),
    0
  );

  // --- 7-Day Multi-Series Trend ---
  const trend7d = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowMs - i * 86400000);
    const dateStr = getVietnamDate(d);
    const parts = dateStr.split('-');
    const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;

    const regs = users.filter(
      (u) => u.createdAt && getVietnamDate(new Date(u.createdAt)) === dateStr
    ).length;

    const dayLogins = loginHistory.filter(
      (e) => e.timestamp && getVietnamDate(new Date(e.timestamp)) === dateStr
    );
    const uniqueDayLogins = new Set(dayLogins.map((e) => e.userId)).size;

    const dayOrders = orders.filter(
      (o) => o.createdAt && getVietnamDate(new Date(o.createdAt)) === dateStr
    );
    const dayResponses = dayOrders.reduce((s, o) => s + (o.completedCount || 0), 0);

    const dayRev = completedDeposits
      .filter((t) => t.createdAt && getVietnamDate(new Date(t.createdAt)) === dateStr)
      .reduce((s, t) => s + (t.amount || 0), 0);

    const vDay = visitorStats.dailyHistory7d?.find((x) => x.date === dateStr);

    trend7d.push({
      date: dateStr,
      label,
      registrations: regs,
      logins: dayLogins.length,
      uniqueLogins: Math.max(uniqueDayLogins, vDay?.loggedIn || 0),
      orders: dayOrders.length,
      responses: dayResponses,
      revenue: dayRev,
      views: vDay?.views || 0,
      uniqueVisitors: vDay?.unique || 0,
    });
  }

  // --- Enriched Users Payload ---
  const enrichedUsers = users.map((u) => {
    const oStat =
      userOrderStats.get(u.id) ||
      userOrderStats.get(`email:${u.email.toLowerCase()}`) || {
        ordersCount: 0,
        runningOrdersCount: 0,
        submittedCount: 0,
      };
    const fStat = userFinanceStats.get(u.id) || { totalDeposited: 0, totalSpent: 0 };

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status || 'active',
      authProvider: u.authProvider || (u.googleId ? 'google' : 'local'),
      avatar: u.avatar,
      credits: u.credits,
      loginCount: u.loginCount || (u.lastLoginAt ? 1 : 0),
      lastLoginAt: u.lastLoginAt,
      lastActiveAt: u.lastActiveAt || u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      lastLoginDevice: u.lastLoginDevice,
      note: u.note || '',
      createdAt: u.createdAt,
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      referralCount: u.referralCount || 0,
      affiliateEarnings: u.affiliateEarnings || 0,
      ordersCount: oStat.ordersCount,
      runningOrdersCount: oStat.runningOrdersCount,
      submittedCount: oStat.submittedCount,
      totalDeposited: fStat.totalDeposited,
      totalSpent: fStat.totalSpent,
    };
  });

  // --- Lightweight Orders Payload (omit giant responsesQueue) ---
  const lightweightOrders = orders.slice(0, 200).map((o) => ({
    id: o.id,
    userId: o.userId,
    username: o.username,
    userEmail: o.userEmail,
    title: o.title,
    formUrl: o.formUrl,
    platform:
      o.platform ||
      (o.submitUrl?.includes('microsoft') || o.submitUrl?.includes('office.com')
        ? 'microsoft'
        : 'google'),
    mode: o.mode,
    totalTarget: o.totalTarget,
    completedCount: o.completedCount,
    successCount: o.successCount,
    errorCount: o.errorCount,
    status: o.status,
    delayMin: o.delayMin,
    delayMax: o.delayMax,
    costPerResponse: o.costPerResponse || 100,
    totalCost: o.totalCost || 0,
    refundedAmount: o.refundedAmount || 0,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    lastSubmittedAt: o.lastSubmittedAt,
    nextScheduledAt: o.nextScheduledAt,
    logs: (o.logs || []).slice(0, 12),
  }));

  return NextResponse.json({
    success: true,
    metrics: {
      // Accounts & Registrations
      totalUsers: users.length,
      customerUsersCount: customerUsers.length,
      adminUsersCount,
      vipUsersCount,
      bannedUsersCount,
      googleUsersCount,
      localUsersCount,
      newUsersToday,
      newUsers7d,
      newUsers30d,
      // Logins & Active Customers
      loggedInTodayUnique,
      loginsTodayCount: todayLoginEvents.length,
      activeUsers7d,
      everLoggedInCount: Math.max(everLoggedInCount, uniqueLoggedInTodaySet.size),
      totalLoginEvents: loginHistory.length,
      usersWithOrdersCount: usersWithOrdersSet.size,
      depositingUsersCount: depositingUsersSet.size,
      // Finance
      totalRevenue,
      revenueToday,
      revenueThisMonth,
      totalCreditsInCirculation,
      totalCreditsSpent,
      pendingDepositsCount: pendingDeposits.length,
      pendingDepositsAmount,
      totalReferredUsers: allReferrals.length,
      totalAffiliateCommissions,
      // Orders
      totalOrders: orders.length,
      runningOrdersCount,
      pausedOrdersCount,
      completedOrdersCount,
      cancelledOrdersCount,
      totalSubmitted,
      totalTargetResponses,
      totalSuccessResponses,
      totalErrorResponses,
    },
    trend7d,
    users: enrichedUsers,
    orders: lightweightOrders,
    transactions: transactions.slice(0, 200),
    pendingDeposits,
    coupons,
    loginHistory: loginHistory.slice(0, 150),
    auditLogs: auditLogs.slice(0, 100),
    settings,
    visitorStats,
  });
}
