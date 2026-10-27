import fs from 'fs';
import path from 'path';
import { submitGoogleFormResponse, SubmitResponsePayload, sleep } from './googleFormSubmitter';
import { submitMicrosoftFormResponse } from './msFormSubmitter';
import { db } from './db';

export type OrderStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

const ORDERS_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(ORDERS_DIR, 'orders.json');
const TMP_ORDERS_FILE = path.join('/tmp', 'orders.json');

export interface OrderLog {
  timestamp: string;
  index: number;
  status: 'success' | 'error';
  message: string;
}

export interface SurveyOrder {
  id: string;
  userId?: string;
  title: string;
  formUrl: string;
  submitUrl: string;
  mode: 'ratio' | 'data' | 'model' | 'agent';
  totalTarget: number;
  completedCount: number;
  successCount: number;
  errorCount: number;
  status: OrderStatus;
  delayMin: number; // in seconds
  delayMax: number; // in seconds
  costPerResponse?: number;
  totalCost?: number;
  refundedAmount?: number;
  createdAt: string;
  updatedAt: string;
  logs: OrderLog[];
  responsesQueue: SubmitResponsePayload[];
  fbzx?: string;
  pageHistory?: string;
  platform?: 'google' | 'microsoft';
  antiForgeryToken?: string;
  serverSessionId?: string;
  msSchema?: Record<string, any>;
}

// Persistent global store with DB integration
class OrderManager {
  private orders: Map<string, SurveyOrder> = new Map();
  private runningWorkers: Map<string, boolean> = new Map();
  private listeners: Map<string, Set<(order: SurveyOrder) => void>> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    // 1. Try reading /tmp/orders.json (created in runtime)
    try {
      if (fs.existsSync(TMP_ORDERS_FILE)) {
        const raw = fs.readFileSync(TMP_ORDERS_FILE, 'utf8');
        const list: SurveyOrder[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const ord of list) {
            if (ord && ord.id && !this.orders.has(ord.id)) {
              this.orders.set(ord.id, ord);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading /tmp/orders.json:', e);
    }

    // 2. Try reading data/orders.json
    try {
      if (fs.existsSync(ORDERS_FILE)) {
        const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
        const list: SurveyOrder[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const ord of list) {
            if (ord && ord.id && !this.orders.has(ord.id)) {
              this.orders.set(ord.id, ord);
            }
          }
        }
      }
    } catch {}
  }

  private saveToDisk() {
    try {
      const list = Array.from(this.orders.values());
      const jsonStr = JSON.stringify(list, null, 2);

      // 1. Write to /tmp/orders.json (always writable on serverless)
      try {
        fs.writeFileSync(TMP_ORDERS_FILE, jsonStr, 'utf8');
      } catch (err) {
        console.warn('Error writing /tmp/orders.json:', err);
      }

      // 2. Try writing to data/orders.json
      try {
        if (!fs.existsSync(ORDERS_DIR)) {
          fs.mkdirSync(ORDERS_DIR, { recursive: true });
        }
        fs.writeFileSync(ORDERS_FILE, jsonStr, 'utf8');
      } catch {}
    } catch (err) {
      console.warn('Error saving orders to disk:', err);
    }
  }

  createOrder(params: {
    userId?: string;
    title: string;
    formUrl: string;
    submitUrl: string;
    mode: SurveyOrder['mode'];
    totalTarget: number;
    delayMin?: number;
    delayMax?: number;
    costPerResponse?: number;
    totalCost?: number;
    responsesQueue: SubmitResponsePayload[];
    fbzx?: string;
    pageHistory?: string;
    platform?: 'google' | 'microsoft';
    antiForgeryToken?: string;
    serverSessionId?: string;
    msSchema?: Record<string, any>;
  }): SurveyOrder {
    const id = 'ord_' + Math.random().toString(36).substring(2, 9);
    const order: SurveyOrder = {
      id,
      userId: params.userId,
      title: params.title || 'Đơn điền form tự động',
      formUrl: params.formUrl,
      submitUrl: params.submitUrl,
      platform: params.platform || (params.submitUrl.includes('forms.cloud.microsoft') || params.submitUrl.includes('forms.office.com') ? 'microsoft' : 'google'),
      mode: params.mode,
      totalTarget: params.totalTarget,
      completedCount: 0,
      successCount: 0,
      errorCount: 0,
      status: 'pending',
      delayMin: params.delayMin ?? 1.0,
      delayMax: params.delayMax ?? 2.5,
      costPerResponse: params.costPerResponse ?? 100,
      totalCost: params.totalCost ?? (params.totalTarget * (params.costPerResponse ?? 100)),
      refundedAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [],
      responsesQueue: params.responsesQueue,
      fbzx: params.fbzx,
      pageHistory: params.pageHistory,
      antiForgeryToken: params.antiForgeryToken,
      serverSessionId: params.serverSessionId,
      msSchema: params.msSchema,
    };

    this.orders.set(id, order);
    this.saveToDisk();
    return order;
  }

  getOrder(id: string): SurveyOrder | undefined {
    let order = this.orders.get(id);
    if (!order) {
      this.loadFromDisk();
      order = this.orders.get(id);
    }
    return order;
  }

  getAllOrders(): SurveyOrder[] {
    this.loadFromDisk();
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrdersByUser(userId: string): SurveyOrder[] {
    return this.getAllOrders().filter((o) => !o.userId || o.userId === userId);
  }

  updateOrder(id: string, patch: Partial<SurveyOrder>): SurveyOrder | undefined {
    let order = this.getOrder(id);
    if (!order) return undefined;
    Object.assign(order, patch, { updatedAt: new Date().toISOString() });
    this.saveToDisk();
    this.notify(id, order);
    return order;
  }

  saveOrder(order: SurveyOrder): SurveyOrder {
    this.orders.set(order.id, order);
    this.saveToDisk();
    this.notify(order.id, order);
    return order;
  }

  async executeStep(id: string): Promise<SurveyOrder | undefined> {
    const order = this.getOrder(id);
    if (!order) return undefined;

    if (order.status !== 'running' && order.status !== 'pending') {
      return order;
    }

    if (order.completedCount >= order.totalTarget || order.responsesQueue.length === 0) {
      this.updateOrder(id, { status: 'completed' });
      return this.getOrder(id);
    }

    // Ensure status is marked as running
    if (order.status !== 'running') {
      this.updateOrder(id, { status: 'running' });
    }

    const currentPayload = order.responsesQueue[order.completedCount];
    if (!currentPayload) {
      this.updateOrder(id, { status: 'completed' });
      return this.getOrder(id);
    }

    const idx = order.completedCount + 1;
    const isMs =
      order.platform === 'microsoft' ||
      order.submitUrl.includes('forms.cloud.microsoft') ||
      order.submitUrl.includes('forms.office.com');

    const res = isMs
      ? await submitMicrosoftFormResponse(
          order.submitUrl,
          currentPayload,
          order.antiForgeryToken,
          order.serverSessionId,
          order.formUrl,
          order.msSchema
        )
      : await submitGoogleFormResponse(order.submitUrl, currentPayload, order.fbzx, order.pageHistory);

    const logItem: OrderLog = {
      timestamp: new Date().toLocaleTimeString(),
      index: idx,
      status: res.success ? 'success' : 'error',
      message: res.message,
    };

    const newCompleted = order.completedCount + 1;
    const newSuccess = res.success ? order.successCount + 1 : order.successCount;
    const newError = !res.success ? order.errorCount + 1 : order.errorCount;
    const newLogs = [logItem, ...order.logs].slice(0, 50);
    const newStatus: OrderStatus = newCompleted >= order.totalTarget ? 'completed' : 'running';

    this.updateOrder(id, {
      completedCount: newCompleted,
      successCount: newSuccess,
      errorCount: newError,
      status: newStatus,
      logs: newLogs,
    });

    // Auto-refund for errors if completed
    if (newStatus === 'completed' && newError > 0 && order.userId && (order.costPerResponse || 100) > 0) {
      const errorRefund = newError * (order.costPerResponse || 100);
      order.refundedAmount = (order.refundedAmount || 0) + errorRefund;
      db.updateUserCredits(order.userId, errorRefund);
      db.createTransaction({
        userId: order.userId,
        username: 'system',
        type: 'refund',
        amount: errorRefund,
        credits: errorRefund,
        memo: `Tự động hoàn tiền ${newError} phản hồi lỗi ở đơn #${order.id}`,
        status: 'completed',
      });
      this.updateOrder(id, { refundedAmount: order.refundedAmount });
    }

    return this.getOrder(id);
  }

  // Subscribe to real-time events
  subscribe(id: string, cb: (order: SurveyOrder) => void): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id)!.add(cb);
    return () => {
      this.listeners.get(id)?.delete(cb);
    };
  }

  private notify(id: string, order: SurveyOrder) {
    const subs = this.listeners.get(id);
    if (subs) {
      subs.forEach((cb) => cb(order));
    }
  }

  // Start background worker
  async startWorker(id: string) {
    let order = this.getOrder(id);
    if (!order || this.runningWorkers.get(id)) return;

    this.runningWorkers.set(id, true);
    this.updateOrder(id, { status: 'running' });

    while (
      this.runningWorkers.get(id) &&
      order &&
      order.status === 'running' &&
      order.completedCount < order.totalTarget
    ) {
      const updated = await this.executeStep(id);
      if (!updated || updated.status !== 'running' || updated.completedCount >= updated.totalTarget) {
        break;
      }
      order = updated;

      // Random jitter delay
      const delay =
        (order.delayMin + Math.random() * (order.delayMax - order.delayMin)) * 1000;
      await sleep(delay);
    }

    this.runningWorkers.set(id, false);
  }

  pauseWorker(id: string) {
    this.runningWorkers.set(id, false);
    this.updateOrder(id, { status: 'paused' });
  }

  cancelOrder(id: string) {
    const order = this.orders.get(id);
    if (!order) return;

    this.runningWorkers.set(id, false);

    // Calculate un-submitted items to refund
    const uncompleted = Math.max(0, order.totalTarget - order.completedCount);
    if (uncompleted > 0 && order.userId && (order.costPerResponse || 100) > 0) {
      const refundCredits = uncompleted * (order.costPerResponse || 100);
      order.refundedAmount = (order.refundedAmount || 0) + refundCredits;
      db.updateUserCredits(order.userId, refundCredits);
      db.createTransaction({
        userId: order.userId,
        username: 'system',
        type: 'refund',
        amount: refundCredits,
        credits: refundCredits,
        memo: `Hoàn tiền huỷ đơn #${order.id} (${uncompleted} phản hồi chưa thực hiện)`,
        status: 'completed',
      });
    }

    this.updateOrder(id, { status: 'cancelled', refundedAmount: order.refundedAmount });
  }
}

// Global singleton with hot reload method updates
const globalForOrders = global as unknown as { orderManager: OrderManager };
export const orderManager = new OrderManager();
if (globalForOrders.orderManager && (globalForOrders.orderManager as any).orders) {
  (orderManager as any).orders = (globalForOrders.orderManager as any).orders;
}
globalForOrders.orderManager = orderManager;
