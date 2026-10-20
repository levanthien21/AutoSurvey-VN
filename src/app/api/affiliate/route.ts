import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const host = req.headers.get('host') || 'auto-survey-vn.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    if (!user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        programInfo: {
          commissionRate: '10%',
          friendSignupBonus: 10000, // 10,000 Credits for friend
          referrerSignupBonus: 5000, // 5,000 Credits for referrer
          lifetimeDepositCommission: '10%', // 10% on every deposit forever
        },
      });
    }

    const stats = db.getUserAffiliateStats(user.id);
    const referralCode = stats?.referralCode || user.referralCode || user.username.toUpperCase();
    const referralLink = `${baseUrl}/login?ref=${encodeURIComponent(referralCode)}`;

    const rawReferrals = stats?.referrals || [];
    const formattedReferrals = rawReferrals.map((r) => ({
      id: r.id,
      name: r.referredUsername || 'Người dùng',
      signupDate: r.createdAt,
      signupBonus: r.bonusAwarded || 5000,
      depositCommissions: r.depositCommissions || 0,
      totalGenerated: (r.bonusAwarded || 5000) + (r.depositCommissions || 0),
    }));

    return NextResponse.json({
      success: true,
      authenticated: true,
      referralCode,
      referralLink,
      user: {
        id: user.id,
        username: user.username,
        credits: user.credits,
        referralCode,
      },
      stats: {
        referralCode,
        referralLink,
        totalReferred: stats?.referralCount || formattedReferrals.length,
        referralCount: stats?.referralCount || formattedReferrals.length,
        totalEarnings: stats?.affiliateEarnings || 0,
        affiliateEarnings: stats?.affiliateEarnings || 0,
        commissionRate: '10%',
        friendBonus: 10000,
        signupReward: 5000,
      },
      referrals: formattedReferrals,
      programInfo: {
        commissionRate: '10%',
        friendSignupBonus: 10000,
        referrerSignupBonus: 5000,
        lifetimeDepositCommission: '10%',
      },
    });
  } catch (err: any) {
    console.error('Affiliate API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi lấy dữ liệu affiliate' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để tùy chỉnh mã giới thiệu.' }, { status: 401 });
    }

    const { customCode } = await req.json();
    if (!customCode || typeof customCode !== 'string') {
      return NextResponse.json({ success: false, error: 'Mã giới thiệu không hợp lệ.' }, { status: 400 });
    }

    const cleanCode = customCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3 || cleanCode.length > 15) {
      return NextResponse.json({ success: false, error: 'Mã giới thiệu phải từ 3 đến 15 ký tự chữ và số.' }, { status: 400 });
    }

    // Check collision with other users
    const existing = db.findUserByReferralCode(cleanCode);
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ success: false, error: 'Mã giới thiệu này đã có người sử dụng. Vui lòng chọn mã khác.' }, { status: 409 });
    }

    user.referralCode = cleanCode;
    db.saveDb();

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật mã giới thiệu riêng: ${cleanCode}!`,
      newReferralCode: cleanCode,
    });
  } catch (err: any) {
    console.error('Update referral code error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi cập nhật mã' }, { status: 500 });
  }
}
