import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'user' | 'admin';
  credits: number;
  googleId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
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
  };
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure DB directory and file exist
function initDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [],
      transactions: [],
      coupons: [
        {
          code: 'WELCOME50K',
          creditBonus: 50000,
          maxUses: 1000,
          usedCount: 0,
          expiresAt: '2027-12-31T23:59:59.000Z',
        },
        {
          code: 'NCKH2026',
          creditBonus: 100000,
          maxUses: 500,
          usedCount: 0,
          expiresAt: '2027-12-31T23:59:59.000Z',
        },
      ],
      settings: {
        adminEmails: ['admin@autosurvey.vn', 'levanthien21@gmail.com'],
        pricePerResponse: {
          ratio: 100, // 100 credits = 100 VND / submission
          data: 80,
          model: 150,
          agent: 200,
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

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database, creating backup and reinitializing', err);
    return initDb();
  }
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

  private getDb(): DatabaseSchema {
    if (!this.cache) {
      this.cache = initDb();
    }
    return this.cache;
  }

  private saveDb() {
    if (!this.cache) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), 'utf8');
    } catch (err) {
      // In serverless environments like Vercel, write to /tmp
      try {
        const tmpFile = path.join('/tmp', 'database.json');
        fs.writeFileSync(tmpFile, JSON.stringify(this.cache, null, 2), 'utf8');
      } catch (tmpErr) {
        // In-memory cache continues serving read/write operations seamlessly
      }
    }
  }

  // --- Admin Email Whitelist ---
  getAdminEmails(): string[] {
    const db = this.getDb();
    if (!db.settings.adminEmails || !Array.isArray(db.settings.adminEmails)) {
      db.settings.adminEmails = ['admin@autosurvey.vn', 'levanthien21@gmail.com'];
      this.saveDb();
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

  private checkAndPromoteUser(user?: User): User | undefined {
    if (!user) return undefined;
    if (user.role !== 'admin' && this.isAdminEmail(user.email)) {
      user.role = 'admin';
      this.saveDb();
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
    const initialCredits = finalRole === 'admin' ? 1000000 : 50000;

    const user: User = {
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      username,
      email,
      passwordHash,
      salt,
      role: finalRole,
      credits: initialCredits,
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
    const initialCredits = finalRole === 'admin' ? 1000000 : 50000;

    const user: User = {
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      username: finalUsername,
      email: cleanEmail,
      passwordHash,
      salt,
      role: finalRole,
      credits: initialCredits,
      googleId: params.googleId,
      avatar: params.avatar,
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
          ? 'Đăng nhập Google: Khởi tạo Quản trị viên (1.000.000 Credits)'
          : 'Đăng nhập Google: Quà tặng thành viên mới (50.000 Credits)',
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    this.saveDb();
    return user;
  }

  updateUserCredits(userId: string, deltaCredits: number): User | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    user.credits = Math.max(0, user.credits + deltaCredits);
    user.updatedAt = new Date().toISOString();
    this.saveDb();
    return user;
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

  // --- Settings ---
  getSettings() {
    return this.getDb().settings;
  }

  updateSettings(patch: Partial<DatabaseSchema['settings']>) {
    const db = this.getDb();
    Object.assign(db.settings, patch);
    this.saveDb();
    return db.settings;
  }
}

export const db = new DatabaseManager();
