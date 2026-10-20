import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { orderManager } from '@/lib/orderStore';
import { analytics } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Không có quyền truy cập quản trị' }, { status: 403 });
  }

  const users = db.getAllUsers();
  const transactions = db.getAllTransactions();
  const orders = orderManager.getAllOrders();
  const settings = db.getSettings();

  // Metrics
  const totalRevenue = transactions
    .filter((t) => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCreditsInCirculation = users.reduce((sum, u) => sum + u.credits, 0);
  const pendingDeposits = transactions.filter((t) => t.type === 'deposit' && t.status === 'pending');
  const totalSubmitted = orders.reduce((sum, o) => sum + o.completedCount, 0);

  const allReferrals = db.getAllReferrals();
  const totalAffiliateCommissions = users.reduce((sum, u) => sum + (u.affiliateEarnings || 0), 0);
  const totalReferredUsers = allReferrals.length;

  return NextResponse.json({
    success: true,
    metrics: {
      totalUsers: users.length,
      totalRevenue,
      totalCreditsInCirculation,
      totalOrders: orders.length,
      totalSubmitted,
      pendingDepositsCount: pendingDeposits.length,
      totalReferredUsers,
      totalAffiliateCommissions,
    },
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      credits: u.credits,
      createdAt: u.createdAt,
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      referralCount: u.referralCount || 0,
      affiliateEarnings: u.affiliateEarnings || 0,
    })),
    pendingDeposits,
    settings,
    visitorStats: analytics.getStats(),
  });
}
