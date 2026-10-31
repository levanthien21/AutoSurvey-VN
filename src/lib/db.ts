import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { put } from '@vercel/blob';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'user' | 'admin';
  status?: 'active' | 'vip' | 'banned';
  authProvider?: 'local' | 'google' | 'firebase';
  credits: number;
  referralCode?: string;
  referredBy?: string; // ID of the user who referred them
  affiliateEarnings?: number; // Total credits earned from referrals
  referralCount?: number; // Number of referred friends
  googleId?: string;
  avatar?: string;
  loginCount?: number;
  lastLoginAt?: string;
  lastActiveAt?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  note?: string; // Internal CRM note by Admin
  resetOtp?: string;
  resetOtpExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginEvent {
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

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  target?: string;
  details: string;
  timestamp: string;
}

export interface SystemAnnouncement {
  enabled: boolean;
  text: string;
  type: 'info' | 'promo' | 'warning';
  linkText?: string;
  linkUrl?: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerUsername: string;
  referredUserId: string;
  referredUsername: string;
  bonusAwarded: number;
  depositCommissions: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: 'deposit' | 'order_charge' | 'refund' | 'bonus';
  amount: number; // in VND or credits
  credits: number;
  status: 'pending' | 'completed' | 'rejected';
  memo: string;
  bankCode?: string;
  accountNumber?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface Coupon {
  code: string;
  creditBonus: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
}

export interface DatabaseSchema {
  users: User[];
  transactions: Transaction[];
  coupons: Coupon[];
  referrals?: ReferralRecord[];
  loginHistory?: LoginEvent[];
  auditLogs?: AdminAuditLog[];
  settings: {
    adminEmails: string[];
    pricePerResponse: {
      ratio: number;
      data: number;
      model: number;
      agent: number;
    };
    bankInfo: {
      bankName: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
    };
    defaultDelayMin: number;
    defaultDelayMax: number;
    welcomeCredits?: number;
    referralBonusCredits?: number;
    announcement?: SystemAnnouncement;
    maintenanceMode?: boolean;
  };
}

export function parseDeviceFromUA(ua?: string): string {
  if (!ua) return '💻 Trình duyệt Web';
  const low = ua.toLowerCase();
  const isZalo = low.includes('zalo');
  const isFb = low.includes('fban') || low.includes('fbav') || low.includes('messenger');
  const isIphone = low.includes('iphone') || low.includes('ipad');
  const isAndroid = low.includes('android');
  const isMac = low.includes('macintosh') || low.includes('mac os');
  const isWin = low.includes('windows');

  let browser = 'Web';
  if (isZalo) browser = 'Zalo App';
  else if (isFb) browser = 'Facebook App';
  else if (low.includes('edg/')) browser = 'Edge';
  else if (low.includes('coccoc')) browser = 'Cốc Cốc';
  else if (low.includes('chrome') && !low.includes('edg/')) browser = 'Chrome';
  else if (low.includes('safari') && !low.includes('chrome')) browser = 'Safari';
  else if (low.includes('firefox')) browser = 'Firefox';

  if (isIphone) return `📱 iPhone/iOS (${browser})`;
  if (isAndroid) return `📱 Android (${browser})`;
  if (low.includes('mobile')) return `📱 Điện thoại (${browser})`;
  if (isWin) return `💻 Windows PC (${browser})`;
  if (isMac) return `💻 MacOS (${browser})`;
  return `💻 Desktop (${browser})`;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');
const TMP_FILE = path.join('/tmp', 'database.json');

// Ensure DB directory and file exist
function initDb(): DatabaseSchema {
  // First priority: check /tmp on serverless environments (contains latest runtime updates)
  if (fs.existsSync(TMP_FILE)) {
    try {
      const tmpRaw = fs.readFileSync(TMP_FILE, 'utf8');
      const parsed = JSON.parse(tmpRaw);
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('Error reading from /tmp/database.json:', err);
    }
  }

  // Second priority: check project DB_FILE
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading database file:', err);
    }
  }

  if (!fs.existsSync(DB_DIR)) {
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
    } catch {}
  }

  const initialData: DatabaseSchema = {
    users: [],
    transactions: [],
    coupons: [
      {
        code: 'WELCOME10K',
        creditBonus: 10000,
        maxUses: 1000,
        usedCount: 0,
        expiresAt: '2027-12-31T23:59:59.000Z',
      },
      {
        code: 'NCKH2026',
        creditBonus: 20000,
        maxUses: 500,
        usedCount: 0,
        expiresAt: '2027-12-31T23:59:59.000Z',
      },
    ],
    settings: {
      adminEmails: ['levanthien21052004@gmail.com', 'thienlv.bbh@gmail.com'],
      pricePerResponse: {
        ratio: 250, // 250 credits = 250 VND / submission
        data: 180,
        model: 350,
        agent: 500,
      },
      bankInfo: {
        bankName: 'VIETCOMBANK',
        bankCode: 'VCB',
        accountNumber: '9349850292',
        accountName: 'LE VAN THIEN',
      },
      defaultDelayMin: 1.0,
      defaultDelayMax: 2.5,
    },
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  } catch {}
  return initialData;
}

// Password hashing helper using standard crypto
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  return hashPassword(password, salt) === hash;
}

// Database helper operations
class DatabaseManager {
  private cache: DatabaseSchema | null = null;
  private lastBlobSyncAt: number = 0;

  private getDb(): DatabaseSchema {
    if (!this.cache) {
      this.cache = initDb();
      // Ensure essential coupons exist
      const defaultCoupons: Coupon[] = [
        { code: 'WELCOME10K', creditBonus: 10000, maxUses: 1000, usedCount: 0, expiresAt: '2027-12-31T23:59:59.000Z' },
        { code: 'NCKH2026', creditBonus: 20000, maxUses: 500, usedCount: 0, expiresAt: '2027-12-31T23:59:59.000Z' },
        { code: 'PASSMON10', creditBonus: 15000, maxUses: 1000, usedCount: 0, expiresAt: '2027-12-31T23:59:59.000Z' },
      ];
      if (!this.cache.coupons) this.cache.coupons = [];
      for (const dc of defaultCoupons) {
        if (!this.cache.coupons.some((c) => c.code.toUpperCase() === dc.code)) {
          this.cache.coupons.push(dc);
        }
      }
      if (!this.cache.loginHistory) this.cache.loginHistory = [];
      if (!this.cache.auditLogs) this.cache.auditLogs = [];
      if (this.cache.settings) {
        if (this.cache.settings.welcomeCredits === undefined) this.cache.settings.welcomeCredits = 5000;
        if (this.cache.settings.referralBonusCredits === undefined) this.cache.settings.referralBonusCredits = 5000;
        if (!this.cache.settings.announcement) {
          this.cache.settings.announcement = {
            enabled: false,
            text: 'Chào mừng mùa NCKH! Tặng ngay 5.000 Credits trải nghiệm cho tài khoản đăng ký mới.',
            type: 'promo',
            linkText: 'Nạp ngay',
            linkUrl: '/credit',
          };
        }
      }
    }
    return this.cache;
  }

  public saveDb() {
    if (!this.cache) return;
    const jsonStr = JSON.stringify(this.cache, null, 2);
    // Write to /tmp on serverless environments
    try {
      fs.writeFileSync(TMP_FILE, jsonStr, 'utf8');
    } catch {}
    // Also attempt writing to project DB_FILE
    try {
      fs.writeFileSync(DB_FILE, jsonStr, 'utf8');
    } catch {}
    // Persist to Vercel Blob cloud store asynchronously
    this.saveToBlob().catch(() => {});
  }

  public async syncFromBlob(force = false): Promise<void> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return;
    const now = Date.now();
    if (!force && now - this.lastBlobSyncAt < 45000) return;
    this.lastBlobSyncAt = now;

    try {
      const res = await fetch('https://meo68oenlhu0k0ib.public.blob.vercel-storage.com/database.json', {
        cache: 'no-store',
      });
      if (res.ok) {
        const text = await res.text();
        if (!text || !text.trim().startsWith('{')) return;
        const remoteDb: DatabaseSchema = JSON.parse(text);
        if (remoteDb && Array.isArray(remoteDb.users)) {
          if (!this.cache) {
            this.cache = remoteDb;
          } else {
            // Merge users
            const userMap = new Map<string, User>();
            remoteDb.users.forEach((u) => {
              if (u && u.id) userMap.set(u.id, u);
            });
            this.cache.users.forEach((u) => {
              if (u && u.id) {
                const existing = userMap.get(u.id);
                if (
                  !existing ||
                  new Date(u.updatedAt || u.createdAt).getTime() >=
                    new Date(existing.updatedAt || existing.createdAt).getTime()
                ) {
                  userMap.set(u.id, u);
                }
              }
            });
            this.cache.users = Array.from(userMap.values());

            if (remoteDb.transactions) {
              const txMap = new Map();
              (remoteDb.transactions || []).forEach((t) => txMap.set(t.id, t));
              (this.cache.transactions || []).forEach((t) => txMap.set(t.id, t));
              this.cache.transactions = Array.from(txMap.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            }
            if (remoteDb.loginHistory) {
              const lhMap = new Map();
              (remoteDb.loginHistory || []).forEach((l) => lhMap.set(l.id, l));
              (this.cache.loginHistory || []).forEach((l) => lhMap.set(l.id, l));
              this.cache.loginHistory = Array.from(lhMap.values())
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 300);
            }
            if (remoteDb.auditLogs) {
              const alMap = new Map();
              (remoteDb.auditLogs || []).forEach((l) => alMap.set(l.id, l));
              (this.cache.auditLogs || []).forEach((l) => alMap.set(l.id, l));
              this.cache.auditLogs = Array.from(alMap.values())
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 200);
            }
          }
          // Also save to /tmp
          try {
            fs.writeFileSync(TMP_FILE, JSON.stringify(this.cache, null, 2), 'utf8');
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Sync database from blob notice:', err);
    }
  }

  public async saveToBlob(): Promise<void> {
    if (!process.env.BLOB_READ_WRITE_TOKEN || !this.cache) return;
    try {
      await put('database.json', JSON.stringify(this.cache, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } catch (err) {
      console.warn('Save database to blob error:', err);
    }
  }

  public upsertUser(user: User): User {
    const db = this.getDb();
    const idx = db.users.findIndex(
      (u) => u.id === user.id || (user.email && u.email && u.email.toLowerCase() === user.email.toLowerCase())
    );
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...user, updatedAt: new Date().toISOString() };
      this.saveDb();
      return this.checkAndPromoteUser(db.users[idx])!;
    } else {
      db.users.push(user);
      this.saveDb();
      return this.checkAndPromoteUser(user)!;
    }
  }

  // --- Admin Email Whitelist ---
  getAdminEmails(): string[] {
    const db = this.getDb();
    const defaultAdmins = ['levanthien21052004@gmail.com', 'thienlv.bbh@gmail.com'];
    if (!db.settings.adminEmails || !Array.isArray(db.settings.adminEmails)) {
      db.settings.adminEmails = defaultAdmins;
      this.saveDb();
    } else {
      let changed = false;
      for (const adminEmail of defaultAdmins) {
        if (!db.settings.adminEmails.some((a) => a.toLowerCase() === adminEmail.toLowerCase())) {
          db.settings.adminEmails.push(adminEmail);
          changed = true;
        }
      }
      if (changed) {
        this.saveDb();
      }
    }
    return db.settings.adminEmails;
  }

  isAdminEmail(email?: string): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    const adminEmails = this.getAdminEmails();
    return adminEmails.some((a) => a.toLowerCase() === clean);
  }

  addAdminEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    const adminEmails = this.getAdminEmails();
    if (!adminEmails.some((a) => a.toLowerCase() === clean)) {
      adminEmails.push(clean);
      this.saveDb();
      return true;
    }
    return false;
  }

  removeAdminEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    const adminEmails = this.getAdminEmails();
    const idx = adminEmails.findIndex((a) => a.toLowerCase() === clean);
    if (idx !== -1) {
      adminEmails.splice(idx, 1);
      this.saveDb();
      return true;
    }
    return false;
  }

  private checkAndPromoteUser(user?: User): User | undefined {
    if (!user) return undefined;
    let changed = false;

    // Auto-generate referral code if not exists
    if (!user.referralCode) {
      const cleanName = (user.username || 'REF').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      user.referralCode = cleanName ? `${cleanName}${crypto.randomBytes(2).toString('hex').toUpperCase()}` : `REF${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      user.affiliateEarnings = user.affiliateEarnings || 0;
      user.referralCount = user.referralCount || 0;
      changed = true;
    }

    if (this.isAdminEmail(user.email) || user.role === 'admin') {
      let changed = false;
      if (user.role !== 'admin') {
        user.role = 'admin';
        changed = true;
      }
      // Admin accounts have unlimited credits (999,999,999)
      if ((user.credits || 0) < 999999999) {
        user.credits = 999999999;
        changed = true;
      }
      if (changed) {
        this.saveDb();
      }
    }
    return user;
  }

  // --- Users ---
  findUserByUsername(username: string): User | undefined {
    const db = this.getDb();
    const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    return this.checkAndPromoteUser(user);
  }

  findUserByEmail(email: string): User | undefined {
    const db = this.getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return this.checkAndPromoteUser(user);
  }

  findUserById(id: string): User | undefined {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === id);
    return this.checkAndPromoteUser(user);
  }

  createUser(username: string, email: string, passwordPlain: string, role?: 'user' | 'admin'): User {
    const db = this.getDb();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(passwordPlain, salt);

    // Auto-detect admin permission based on Email whitelist or if this is the very first registered user
    const isFirstUser = db.users.length === 0;
    const isWhitelistedAdmin = this.isAdminEmail(email);
    const finalRole: 'user' | 'admin' = role === 'admin' || isWhitelistedAdmin || isFirstUser ? 'admin' : 'user';
    const welcomeCredits = db.settings?.welcomeCredits ?? 5000;
    const initialCredits = finalRole === 'admin' ? 999999999 : welcomeCredits;

    const user: User = {
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      username,
      email,
      passwordHash,
      salt,
      role: finalRole,
      status: 'active',
      authProvider: 'local',
      credits: initialCredits,
      loginCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(user);
    this.saveDb();
    return user;
  }

  createGoogleUser(params: { email: string; name?: string; avatar?: string; googleId?: string }): User {
    const db = this.getDb();
    const cleanEmail = params.email.trim().toLowerCase();

    // Check if user already exists with this email
    let existing = this.findUserByEmail(cleanEmail);
    if (existing) {
      if (params.googleId && !existing.googleId) {
        existing.googleId = params.googleId;
      }
      if (params.avatar && !existing.avatar) {
        existing.avatar = params.avatar;
      }
      if (!existing.authProvider) {
        existing.authProvider = 'google';
      }
      this.checkAndPromoteUser(existing);
      this.saveDb();
      return existing;
    }

    // Determine clean username from name or email prefix
    let baseUsername = (params.name || cleanEmail.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);
    if (!baseUsername || baseUsername.length < 3) {
      baseUsername = 'gg_' + crypto.randomBytes(3).toString('hex');
    }

    // Ensure unique username
    let finalUsername = baseUsername;
    let counter = 1;
    while (db.users.some((u) => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${baseUsername}${counter++}`;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const randomPass = crypto.randomBytes(24).toString('hex');
    const passwordHash = hashPassword(randomPass, salt);

    const isFirstUser = db.users.length === 0;
    const isWhitelistedAdmin = this.isAdminEmail(cleanEmail);
    const finalRole: 'user' | 'admin' = isWhitelistedAdmin || isFirstUser ? 'admin' : 'user';
    const welcomeCredits = db.settings?.welcomeCredits ?? 5000;
    const initialCredits = finalRole === 'admin' ? 999999999 : welcomeCredits;

    const user: User = {
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      username: finalUsername,
      email: cleanEmail,
      passwordHash,
      salt,
      role: finalRole,
      status: 'active',
      authProvider: 'google',
      credits: initialCredits,
      googleId: params.googleId,
      avatar: params.avatar,
      loginCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(user);

    // Record welcome bonus transaction
    db.transactions.unshift({
      id: 'tx_' + crypto.randomBytes(6).toString('hex'),
      userId: user.id,
      username: user.username,
      type: 'bonus',
      amount: 0,
      credits: initialCredits,
      memo:
        finalRole === 'admin'
          ? 'Đăng nhập Google: Khởi tạo Quản trị viên (Credits Không giới hạn)'
          : 'Đăng nhập Google: Quà tặng thành viên mới (5.000 Credits)',
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    this.saveDb();
    return user;
  }

  updateUserCredits(userId: string, deltaCredits: number): User | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    if (user.role === 'admin') {
      // Admin has unlimited credits, never deduct or restrict
      user.credits = 999999999;
      user.updatedAt = new Date().toISOString();
      this.saveDb();
      return user;
    }
    user.credits = Math.max(0, user.credits + deltaCredits);
    user.updatedAt = new Date().toISOString();
    this.saveDb();
    return user;
  }

  setResetOtp(userId: string, otp: string, expiry: string): boolean {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return false;
    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    this.saveDb();
    return true;
  }

  verifyAndResetPassword(
    emailOrUsername: string,
    otp: string,
    newPassword: string
  ): { success: boolean; error?: string; user?: User } {
    const db = this.getDb();
    const clean = emailOrUsername.trim().toLowerCase();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
    );
    if (!user) {
      return { success: false, error: 'Không tìm thấy tài khoản người dùng.' };
    }
    if (!user.resetOtp || user.resetOtp !== otp.trim()) {
      return { success: false, error: 'Mã xác thực khôi phục mật khẩu không chính xác.' };
    }
    if (user.resetOtpExpiry && new Date(user.resetOtpExpiry).getTime() < Date.now()) {
      return { success: false, error: 'Mã xác thực đã hết hạn. Vui lòng bấm gửi lại mã mới.' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    user.passwordHash = hashPassword(newPassword, salt);
    user.salt = salt;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.updatedAt = new Date().toISOString();
    this.saveDb();
    return { success: true, user };
  }

  getAllUsers(): User[] {
    return this.getDb().users;
  }

  // --- Transactions ---
  createTransaction(params: {
    userId: string;
    username: string;
    type: Transaction['type'];
    amount: number;
    credits: number;
    memo: string;
    status?: Transaction['status'];
  }): Transaction {
    const db = this.getDb();
    const tx: Transaction = {
      id: 'tx_' + crypto.randomBytes(6).toString('hex'),
      userId: params.userId,
      username: params.username,
      type: params.type,
      amount: params.amount,
      credits: params.credits,
      memo: params.memo,
      bankCode: db.settings.bankInfo.bankCode,
      accountNumber: db.settings.bankInfo.accountNumber,
      status: params.status || 'pending',
      createdAt: new Date().toISOString(),
    };

    db.transactions.unshift(tx);
    this.saveDb();
    return tx;
  }

  approveTransaction(txId: string): Transaction | undefined {
    const db = this.getDb();
    const tx = db.transactions.find((t) => t.id === txId);
    if (!tx || tx.status !== 'pending') return undefined;

    tx.status = 'completed';
    tx.approvedAt = new Date().toISOString();

    // Credit user account
    this.updateUserCredits(tx.userId, tx.credits);
    this.saveDb();
    return tx;
  }

  rejectTransaction(txId: string, reason?: string): Transaction | undefined {
    const db = this.getDb();
    const tx = db.transactions.find((t) => t.id === txId);
    if (!tx || tx.status !== 'pending') return undefined;

    tx.status = 'rejected';
    tx.approvedAt = new Date().toISOString();
    if (reason && reason.trim()) {
      tx.memo = `${tx.memo} [Từ chối: ${reason.trim()}]`;
    }
    this.saveDb();
    return tx;
  }

  getUserTransactions(userId: string): Transaction[] {
    const db = this.getDb();
    return db.transactions.filter((t) => t.userId === userId);
  }

  getAllTransactions(): Transaction[] {
    const db = this.getDb();
    return db.transactions;
  }

  // --- Coupons ---
  redeemCoupon(code: string, userId: string): { success: boolean; message: string; bonus?: number } {
    const db = this.getDb();
    const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!coupon) {
      return { success: false, message: 'Mã khuyến mãi không tồn tại.' };
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return { success: false, message: 'Mã khuyến mãi đã hết lượt sử dụng.' };
    }
    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { success: false, message: 'Mã khuyến mãi đã hết hạn.' };
    }

    coupon.usedCount += 1;
    this.updateUserCredits(userId, coupon.creditBonus);

    // Record transaction
    const user = this.findUserById(userId);
    if (user) {
      this.createTransaction({
        userId,
        username: user.username,
        type: 'bonus',
        amount: 0,
        credits: coupon.creditBonus,
        memo: `Mã quà tặng: ${coupon.code}`,
        status: 'completed',
      });
    }

    this.saveDb();
    return { success: true, message: `Áp dụng thành công! Đã cộng ${coupon.creditBonus.toLocaleString()} Credits`, bonus: coupon.creditBonus };
  }

  getCoupons(): Coupon[] {
    return this.getDb().coupons;
  }

  createCoupon(params: { code: string; creditBonus: number; maxUses: number; expiresAt: string }): Coupon {
    const db = this.getDb();
    const cleanCode = params.code.trim().toUpperCase();
    const existing = db.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (existing) {
      existing.creditBonus = params.creditBonus;
      existing.maxUses = params.maxUses;
      existing.expiresAt = params.expiresAt;
      this.saveDb();
      return existing;
    }
    const coupon: Coupon = {
      code: cleanCode,
      creditBonus: params.creditBonus,
      maxUses: params.maxUses,
      usedCount: 0,
      expiresAt: params.expiresAt,
    };
    db.coupons.unshift(coupon);
    this.saveDb();
    return coupon;
  }

  deleteCoupon(code: string): boolean {
    const db = this.getDb();
    const cleanCode = code.trim().toUpperCase();
    const idx = db.coupons.findIndex((c) => c.code.toUpperCase() === cleanCode);
    if (idx === -1) return false;
    db.coupons.splice(idx, 1);
    this.saveDb();
    return true;
  }

  // --- Settings ---
  getSettings() {
    return this.getDb().settings;
  }

  updateSettings(patch: Partial<DatabaseSchema['settings']>) {
    const db = this.getDb();
    if (patch.adminEmails && Array.isArray(patch.adminEmails)) {
      const cleaned = Array.from(
        new Set(
          patch.adminEmails
            .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
            .filter((e) => e.length > 3 && e.includes('@'))
        )
      );
      if (cleaned.length === 0) {
        cleaned.push('levanthien21052004@gmail.com');
      }
      patch.adminEmails = cleaned;

      // Sync roles & credits for users
      db.users.forEach((u) => {
        if (cleaned.includes(u.email.toLowerCase())) {
          u.role = 'admin';
          u.credits = 999999999;
        }
      });
    }

    Object.assign(db.settings, patch);
    this.saveDb();
    return db.settings;
  }

  // --- Affiliate & Referral Program ---
  findUserByReferralCode(code: string): User | undefined {
    if (!code) return undefined;
    const clean = code.trim().toUpperCase();
    const db = this.getDb();
    const user = db.users.find(
      (u) =>
        (u.referralCode && u.referralCode.toUpperCase() === clean) ||
        u.username.toUpperCase() === clean
    );
    return this.checkAndPromoteUser(user);
  }

  recordReferral(params: {
    referrerId: string;
    referredUserId: string;
    referredUsername: string;
    bonus: number;
  }): ReferralRecord | null {
    const db = this.getDb();
    if (!db.referrals) db.referrals = [];

    const referrer = this.findUserById(params.referrerId);
    if (!referrer) return null;

    const record: ReferralRecord = {
      id: 'ref_' + crypto.randomBytes(6).toString('hex'),
      referrerId: params.referrerId,
      referrerUsername: referrer.username,
      referredUserId: params.referredUserId,
      referredUsername: params.referredUsername,
      bonusAwarded: params.bonus,
      depositCommissions: 0,
      createdAt: new Date().toISOString(),
    };

    db.referrals.unshift(record);

    // Update referrer stats
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.affiliateEarnings = (referrer.affiliateEarnings || 0) + params.bonus;
    this.updateUserCredits(referrer.id, params.bonus);

    // Log transaction for referrer
    this.createTransaction({
      userId: referrer.id,
      username: referrer.username,
      type: 'bonus',
      amount: 0,
      credits: params.bonus,
      memo: `Hoa hồng giới thiệu bạn bè: ${params.referredUsername} đăng ký thành công (+${params.bonus.toLocaleString()} Credits)`,
      status: 'completed',
    });

    this.saveDb();
    return record;
  }

  rewardReferrerOnDeposit(referredUserId: string, depositAmount: number): number {
    const db = this.getDb();
    const user = this.findUserById(referredUserId);
    if (!user || !user.referredBy) return 0;

    const referrer = this.findUserById(user.referredBy);
    if (!referrer) return 0;

    // 10% commission on deposit amount
    const commissionCredits = Math.round(depositAmount * 0.10);
    if (commissionCredits <= 0) return 0;

    this.updateUserCredits(referrer.id, commissionCredits);
    referrer.affiliateEarnings = (referrer.affiliateEarnings || 0) + commissionCredits;

    // Update referral record
    if (db.referrals) {
      const rec = db.referrals.find((r) => r.referredUserId === referredUserId);
      if (rec) {
        rec.depositCommissions = (rec.depositCommissions || 0) + commissionCredits;
      }
    }

    // Log transaction
    this.createTransaction({
      userId: referrer.id,
      username: referrer.username,
      type: 'bonus',
      amount: depositAmount,
      credits: commissionCredits,
      memo: `Hoa hồng 10% nạp tiền VietQR từ bạn bè: ${user.username} (+${commissionCredits.toLocaleString()} Credits)`,
      status: 'completed',
    });

    this.saveDb();
    return commissionCredits;
  }

  getUserAffiliateStats(userId: string) {
    const db = this.getDb();
    const user = this.findUserById(userId);
    if (!user) return null;

    if (!db.referrals) db.referrals = [];
    const myReferrals = db.referrals.filter((r) => r.referrerId === userId);

    return {
      referralCode: user.referralCode || user.username.toUpperCase(),
      referralCount: user.referralCount || myReferrals.length,
      affiliateEarnings: user.affiliateEarnings || 0,
      commissionRate: '10%',
      referrals: myReferrals.slice(0, 50),
    };
  }

  getAllReferrals(): ReferralRecord[] {
    const db = this.getDb();
    return db.referrals || [];
  }

  // --- Login History, User Activity & Security Audit Logs ---
  recordLoginEvent(
    user: User,
    params: { action: LoginEvent['action']; ip?: string; userAgent?: string }
  ): LoginEvent {
    const db = this.getDb();
    if (!db.loginHistory) db.loginHistory = [];

    const now = new Date().toISOString();
    const cleanIp = (params.ip || '127.0.0.1').split(',')[0].trim();
    const device = parseDeviceFromUA(params.userAgent);

    const target = db.users.find((u) => u.id === user.id) || user;
    target.loginCount = (target.loginCount || 0) + 1;
    target.lastLoginAt = now;
    target.lastActiveAt = now;
    target.lastLoginIp = cleanIp;
    target.lastLoginDevice = device;
    target.updatedAt = now;

    const evt: LoginEvent = {
      id: 'lgn_' + crypto.randomBytes(6).toString('hex'),
      userId: target.id,
      username: target.username,
      email: target.email,
      role: target.role,
      action: params.action,
      ip: cleanIp,
      device,
      timestamp: now,
    };

    db.loginHistory.unshift(evt);
    if (db.loginHistory.length > 400) {
      db.loginHistory = db.loginHistory.slice(0, 400);
    }

    this.saveDb();
    return evt;
  }

  touchUserActivity(userId: string, ip?: string, ua?: string): void {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return;

    const nowMs = Date.now();
    const lastMs = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
    // Throttle disk writes to at most once every 60 seconds per user
    if (nowMs - lastMs < 60_000) return;

    user.lastActiveAt = new Date(nowMs).toISOString();
    if (ip) user.lastLoginIp = ip.split(',')[0].trim();
    if (ua) user.lastLoginDevice = parseDeviceFromUA(ua);
    this.saveDb();
  }

  getLoginHistory(): LoginEvent[] {
    const db = this.getDb();
    return db.loginHistory || [];
  }

  recordAuditLog(params: Omit<AdminAuditLog, 'id' | 'timestamp'>): AdminAuditLog {
    const db = this.getDb();
    if (!db.auditLogs) db.auditLogs = [];

    const entry: AdminAuditLog = {
      id: 'aud_' + crypto.randomBytes(6).toString('hex'),
      adminId: params.adminId,
      adminUsername: params.adminUsername,
      action: params.action,
      target: params.target,
      details: params.details,
      timestamp: new Date().toISOString(),
    };

    db.auditLogs.unshift(entry);
    if (db.auditLogs.length > 300) {
      db.auditLogs = db.auditLogs.slice(0, 300);
    }

    this.saveDb();
    return entry;
  }

  getAuditLogs(): AdminAuditLog[] {
    const db = this.getDb();
    return db.auditLogs || [];
  }

  // --- Supreme Admin CRM Methods ---
  adminCreateUser(params: {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    status?: 'active' | 'vip';
    initialCredits: number;
    note?: string;
  }): User {
    const db = this.getDb();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanUsername = params.username.trim();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(params.password, salt);

    const isWhitelistedAdmin = this.isAdminEmail(cleanEmail);
    const finalRole: 'user' | 'admin' = params.role === 'admin' || isWhitelistedAdmin ? 'admin' : 'user';
    const credits = finalRole === 'admin' ? 999999999 : Math.max(0, Number(params.initialCredits) || 0);

    const user: User = {
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      salt,
      role: finalRole,
      status: params.status || 'active',
      authProvider: 'local',
      credits,
      loginCount: 0,
      note: params.note?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.unshift(user);

    if (credits > 0 && finalRole !== 'admin') {
      db.transactions.unshift({
        id: 'tx_' + crypto.randomBytes(6).toString('hex'),
        userId: user.id,
        username: user.username,
        type: 'bonus',
        amount: 0,
        credits,
        memo: 'Admin khởi tạo tài khoản và cấp số dư ban đầu',
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
    }

    this.saveDb();
    return user;
  }

  adminUpdateUser(
    userId: string,
    patch: {
      role?: 'user' | 'admin';
      status?: 'active' | 'vip' | 'banned';
      note?: string;
      newPassword?: string;
    }
  ): User | undefined {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return undefined;

    if (patch.role) {
      // Prevent demoting whitelisted master admin emails accidentally
      if (patch.role === 'user' && this.isAdminEmail(user.email)) {
        user.role = 'admin';
      } else {
        user.role = patch.role;
      }
      if (user.role === 'admin') {
        user.credits = 999999999;
      } else if (user.credits >= 999999999) {
        user.credits = db.settings?.welcomeCredits ?? 5000;
      }
    }

    if (patch.status) {
      // Never ban whitelisted admin emails
      if (patch.status === 'banned' && this.isAdminEmail(user.email)) {
        user.status = 'active';
      } else {
        user.status = patch.status;
      }
    }

    if (typeof patch.note === 'string') {
      user.note = patch.note.trim();
    }

    if (patch.newPassword && patch.newPassword.trim().length >= 4) {
      const salt = crypto.randomBytes(16).toString('hex');
      user.passwordHash = hashPassword(patch.newPassword.trim(), salt);
      user.salt = salt;
    }

    user.updatedAt = new Date().toISOString();
    this.saveDb();
    return user;
  }

  adminDeleteUser(userId: string): boolean {
    const db = this.getDb();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    // Never delete whitelisted admin account
    if (this.isAdminEmail(db.users[idx].email)) return false;
    db.users.splice(idx, 1);
    this.saveDb();
    return true;
  }

  adminBulkGiftCredits(params: {
    target: 'all' | 'vip' | 'active7d';
    credits: number;
    memo: string;
  }): number {
    const db = this.getDb();
    const amount = Math.round(Number(params.credits));
    if (!amount || amount <= 0) return 0;

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    let count = 0;

    for (const u of db.users) {
      if (u.role === 'admin' || u.status === 'banned') continue;
      if (params.target === 'vip' && u.status !== 'vip') continue;
      if (params.target === 'active7d') {
        const lastTs = u.lastActiveAt || u.lastLoginAt || u.createdAt;
        if (!lastTs || new Date(lastTs).getTime() < sevenDaysAgo) continue;
      }

      u.credits = Math.max(0, (u.credits || 0) + amount);
      u.updatedAt = new Date().toISOString();
      db.transactions.unshift({
        id: 'tx_' + crypto.randomBytes(6).toString('hex'),
        userId: u.id,
        username: u.username,
        type: 'bonus',
        amount: 0,
        credits: amount,
        memo: params.memo || `Quà tặng hệ thống (+${amount.toLocaleString()} Credits)`,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
      count++;
    }

    if (count > 0) {
      this.saveDb();
    }
    return count;
  }
}

const globalForDb = global as unknown as { dbManager?: DatabaseManager };
export const db = new DatabaseManager();
if (globalForDb.dbManager && (globalForDb.dbManager as any).data) {
  (db as any).data = (globalForDb.dbManager as any).data;
}
globalForDb.dbManager = db;
