export interface AdminUserItem {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'vip' | 'banned';
  authProvider: 'local' | 'google' | 'firebase';
  avatar?: string;
  credits: number;
  loginCount: number;
  lastLoginAt?: string;
  lastActiveAt?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  note?: string;
  createdAt: string;
  referralCode?: string;
  referredBy?: string;
  referralCount: number;
  affiliateEarnings: number;
  ordersCount: number;
  runningOrdersCount: number;
  submittedCount: number;
  totalDeposited: number;
  totalSpent: number;
}

export interface AdminOrderItem {
  id: string;
  userId?: string;
  username?: string;
  userEmail?: string;
  title: string;
  formUrl: string;
  platform: 'google' | 'microsoft';
  mode: 'ratio' | 'data' | 'model' | 'agent';
  totalTarget: number;
  completedCount: number;
  successCount: number;
  errorCount: number;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  delayMin: number;
  delayMax: number;
  costPerResponse: number;
  totalCost: number;
  refundedAmount: number;
  createdAt: string;
  updatedAt: string;
  lastSubmittedAt?: string;
  nextScheduledAt?: string;
  logs: {
    timestamp: string;
    index: number;
    status: 'success' | 'error';
    message: string;
  }[];
}

export interface AdminTransactionItem {
  id: string;
  userId: string;
  username: string;
  type: 'deposit' | 'order_charge' | 'refund' | 'bonus';
  amount: number;
  credits: number;
  status: 'pending' | 'completed' | 'rejected';
  memo: string;
  bankCode?: string;
  accountNumber?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface AdminLoginEvent {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  action: 'login_password' | 'login_google' | 'login_firebase' | 'register';
  ip: string;
  device: string;
  timestamp: string;
}

export interface AdminAuditLogItem {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  target?: string;
  details: string;
  timestamp: string;
}

export interface AdminCouponItem {
  code: string;
  creditBonus: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
}

export interface Trend7dItem {
  date: string;
  label: string;
  registrations: number;
  logins: number;
  uniqueLogins: number;
  orders: number;
  responses: number;
  revenue: number;
  views: number;
  uniqueVisitors: number;
}
