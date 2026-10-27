import { submitGoogleFormResponse, SubmitResponsePayload, sleep } from './googleFormSubmitter';
import { submitMicrosoftFormResponse } from './msFormSubmitter';
import { db } from './db';

export type OrderStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

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
  platform?: 'google' | 'microsoft';
  antiForgeryToken?: string;
  serverSessionId?: string;
}

// In-memory global store with DB integration
class OrderManager {
  private orders: Map<string, SurveyOrder> = new Map();
  private runningWorkers: Map<string, boolean> = new Map();
  private listeners: Map<string, Set<(order: SurveyOrder) => void>> = new Map();

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
    platform?: 'google' | 'microsoft';
    antiForgeryToken?: string;
    serverSessionId?: string;
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
      antiForgeryToken: params.antiForgeryToken,
      serverSessionId: params.serverSessionId,
    };

    this.orders.set(id, order);
    return order;
  }

  getOrder(id: string): SurveyOrder | undefined {
    return this.orders.get(id);
  }

  getAllOrders(): SurveyOrder[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrdersByUser(userId: string): SurveyOrder[] {
    return this.getAllOrders().filter((o) => o.userId === userId);
  }

  updateOrder(id: string, patch: Partial<SurveyOrder>): SurveyOrder | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;
    Object.assign(order, patch, { updatedAt: new Date().toISOString() });
    this.notify(id, order);
    return order;
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
    const order = this.orders.get(id);
    if (!order || this.runningWorkers.get(id)) return;

    this.runningWorkers.set(id, true);
    this.updateOrder(id, { status: 'running' });

    while (
      this.runningWorkers.get(id) &&
      order.completedCount < order.totalTarget &&
      order.responsesQueue.length > 0
    ) {
      const currentPayload = order.responsesQueue[order.completedCount];
      if (!currentPayload) break;

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
            order.formUrl
          )
        : await submitGoogleFormResponse(order.submitUrl, currentPayload, order.fbzx);

      const logItem: OrderLog = {
        timestamp: new Date().toLocaleTimeString(),
        index: idx,
        status: res.success ? 'success' : 'error',
        message: res.message,
      };

      order.logs.unshift(logItem);
      if (order.logs.length > 50) order.logs.pop(); // keep last 50 logs

      order.completedCount += 1;
      if (res.success) {
        order.successCount += 1;
      } else {
        order.errorCount += 1;
      }

      this.updateOrder(id, {
        completedCount: order.completedCount,
        successCount: order.successCount,
        errorCount: order.errorCount,
        logs: order.logs,
      });

      if (order.completedCount >= order.totalTarget) {
        break;
      }

      // Random jitter delay
      const delay =
        (order.delayMin + Math.random() * (order.delayMax - order.delayMin)) * 1000;
      await sleep(delay);
    }

    // Auto-refund for any failed submissions upon completion
    if (order.errorCount > 0 && order.userId && (order.costPerResponse || 100) > 0) {
      const errorRefund = order.errorCount * (order.costPerResponse || 100);
      order.refundedAmount = (order.refundedAmount || 0) + errorRefund;
      db.updateUserCredits(order.userId, errorRefund);
      db.createTransaction({
        userId: order.userId,
        username: 'system',
        type: 'refund',
        amount: errorRefund,
        credits: errorRefund,
        memo: `Tự động hoàn tiền ${order.errorCount} phản hồi lỗi ở đơn #${order.id}`,
        status: 'completed',
      });
    }

    if (order.status === 'running' && order.completedCount >= order.totalTarget) {
      this.updateOrder(id, { status: 'completed' });
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
