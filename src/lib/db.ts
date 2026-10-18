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
    // Generate default admin and demo user
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = hashPassword('admin123', adminSalt);

    const demoSalt = crypto.randomBytes(16).toString('hex');
    const demoHash = hashPassword('demo123', demoSalt);

    const initialData: DatabaseSchema = {
      users: [
        {
          id: 'usr_admin',
          username: 'admin',
          email: 'admin@autosurvey.vn',
          passwordHash: adminHash,
          salt: adminSalt,
          role: 'admin',
          credits: 1000000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr_demo',
          username: 'demo',
          email: 'demo@autosurvey.vn',
          passwordHash: demoHash,
          salt: demoSalt,
          role: 'user',
          credits: 250000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      transactions: [
        {
          id: 'tx_init_01',
          userId: 'usr_demo',
          username: 'demo',
          type: 'deposit',
          amount: 250000,
          credits: 250000,
          status: 'completed',
          memo: 'NAP USR_DEMO',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
        },
      ],
      coupons: [
        {
          code: 'WELCOME50K',
          creditBonus: 50000,
          maxUses: 1000,
          usedCount: 1,
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
        pricePerResponse: {
          ratio: 100, // 100 credits = 100 VND / submission
          data: 80,
          model: 150,
          agent: 200,
        },
        bankInfo: {
          bankName: 'MB Bank (Quân Đội)',
          bankCode: 'MB',
          accountNumber: '9999888888',
          accountName: 'AUTO SURVEY VIETNAM',
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

  // --- Users ---
  findUserByUsername(username: string): User | undefined {
    const db = this.getDb();
    return db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  findUserByEmail(email: string): User | undefined {
    const db = this.getDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    const db = this.getDb();
    return db.users.find((u) => u.id === id);
  }

  createUser(username: string, email: string, passwordPlain: string, role: 'user' | 'admin' = 'user'): User {
    const db = this.getDb();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(passwordPlain, salt);
    const user: User = {
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      username,
      email,
      passwordHash,
      salt,
      role,
      credits: 50000, // 50,000 credits welcome gift!
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(user);
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
