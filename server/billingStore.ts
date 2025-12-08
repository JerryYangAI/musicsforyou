/**
 * 订单存储模块
 * 
 * 管理会员订阅和 Credits 购买订单的持久化存储
 * 支持 Stripe PaymentIntent 绑定
 */

import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

// ============ 类型定义 ============

/**
 * 订单类型
 * - pro: Pro 会员订阅
 * - credits: Credits 扩展包
 * - pro-subscription: 兼容旧订单（模拟支付）
 * - credits-pack: 兼容旧订单（模拟支付）
 */
export type OrderType = "pro" | "credits" | "pro-subscription" | "credits-pack";

/**
 * 订单状态
 */
export type OrderStatus = "pending" | "paid" | "failed" | "canceled";

/**
 * 订单接口（扩展版）
 */
export interface Order {
  id: string;
  userId: string;
  
  // 订单类型
  type: OrderType;
  
  // 如果是 credits 订单，记录具体的套餐 ID
  creditsPackId?: string | null;
  
  // 兼容旧字段
  planId?: string | null;
  packId?: string | null;
  
  // 金额（分）
  amount: number;
  currency: string;
  
  // 兼容旧字段（元）
  amountCny?: number;
  
  // Credits 变动数量
  creditsChange?: number;
  
  // Stripe 相关字段
  stripePaymentIntentId?: string | null;
  
  // 订单状态
  status: OrderStatus;
  
  // 时间戳
  createdAt: string;
  updatedAt?: string | null;
  
  // 冗余保存额外信息
  meta?: Record<string, any>;
}

/**
 * 创建订单输入（新版）
 */
export interface CreateOrderInput {
  userId: string;
  type: OrderType;
  creditsPackId?: string | null;
  amount: number;
  currency: string;
  stripePaymentIntentId?: string | null;
  status?: OrderStatus;
  meta?: Record<string, any>;
  // 兼容旧参数
  planId?: string | null;
  packId?: string | null;
  amountCny?: number;
  creditsChange?: number;
}

// ============ 存储配置 ============

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

// 内存缓存
let ordersCache: Order[] | null = null;

// 写入队列，防止并发写入冲突
let writeQueue: Promise<void> = Promise.resolve();

// ============ 工具函数 ============

/**
 * 确保 data 目录存在
 */
function ensureDataDir(): void {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * 加载订单数据
 */
async function loadOrders(): Promise<Order[]> {
  if (ordersCache !== null) {
    return ordersCache;
  }

  ensureDataDir();

  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      const orders = JSON.parse(data) as Order[];
      // 兼容旧数据：为没有 status 字段的订单添加默认值
      ordersCache = orders.map(order => ({
        ...order,
        status: order.status || "paid", // 旧订单默认为已支付
        amount: order.amount ?? (order.amountCny ? order.amountCny * 100 : 0),
        currency: order.currency || "cny",
      }));
      return ordersCache;
    }
  } catch (error) {
    console.error("[BillingStore] 加载订单数据失败:", error);
  }

  ordersCache = [];
  return ordersCache;
}

/**
 * 保存订单数据
 */
async function saveOrders(orders: Order[]): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    ensureDataDir();
    try {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
      ordersCache = orders;
    } catch (error) {
      console.error("[BillingStore] 保存订单数据失败:", error);
      throw error;
    }
  });

  await writeQueue;
}

// ============ 订单操作 ============

/**
 * 创建订单
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const orders = await loadOrders();

  const order: Order = {
    id: uuidv4(),
    userId: input.userId,
    type: input.type,
    creditsPackId: input.creditsPackId ?? input.packId ?? null,
    planId: input.planId ?? null,
    packId: input.packId ?? null,
    amount: input.amount ?? (input.amountCny ? input.amountCny * 100 : 0),
    currency: input.currency || "cny",
    amountCny: input.amountCny ?? (input.amount ? input.amount / 100 : 0),
    creditsChange: input.creditsChange ?? 0,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    status: input.status || "pending",
    createdAt: new Date().toISOString(),
    updatedAt: null,
    meta: input.meta,
  };

  orders.push(order);
  await saveOrders(orders);

  console.log(`[BillingStore] 创建订单成功: ${order.id}, 类型: ${order.type}, 状态: ${order.status}, 用户: ${order.userId}`);

  return order;
}

/**
 * 根据 ID 获取订单
 */
export async function getOrderById(orderId: string): Promise<Order | undefined> {
  const orders = await loadOrders();
  return orders.find(order => order.id === orderId);
}

/**
 * 根据 Stripe PaymentIntent ID 获取订单
 */
export async function getOrderByPaymentIntentId(piId: string): Promise<Order | undefined> {
  const orders = await loadOrders();
  return orders.find(order => order.stripePaymentIntentId === piId);
}

/**
 * 获取用户的所有订单
 */
export async function listUserOrders(userId: string): Promise<Order[]> {
  const orders = await loadOrders();
  return orders
    .filter(order => order.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 获取所有订单（管理员用）
 */
export async function getAllOrders(): Promise<Order[]> {
  return loadOrders();
}

/**
 * 更新订单状态
 */
async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | undefined> {
  const orders = await loadOrders();
  const index = orders.findIndex(o => o.id === orderId);
  
  if (index === -1) {
    console.warn(`[BillingStore] 更新订单状态失败: 订单不存在 ${orderId}`);
    return undefined;
  }

  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();
  
  await saveOrders(orders);
  
  console.log(`[BillingStore] 订单状态已更新: ${orderId} -> ${status}`);
  
  return orders[index];
}

/**
 * 标记订单为已支付
 */
export async function markOrderPaid(orderId: string): Promise<Order | undefined> {
  return updateOrderStatus(orderId, "paid");
}

/**
 * 标记订单为支付失败
 */
export async function markOrderFailed(orderId: string): Promise<Order | undefined> {
  return updateOrderStatus(orderId, "failed");
}

/**
 * 标记订单为已取消
 */
export async function markOrderCanceled(orderId: string): Promise<Order | undefined> {
  return updateOrderStatus(orderId, "canceled");
}

/**
 * 更新订单（通用）
 */
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | undefined> {
  const orders = await loadOrders();
  const index = orders.findIndex(o => o.id === orderId);
  
  if (index === -1) {
    console.warn(`[BillingStore] 更新订单失败: 订单不存在 ${orderId}`);
    return undefined;
  }

  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await saveOrders(orders);
  
  console.log(`[BillingStore] 订单已更新: ${orderId}`);
  
  return orders[index];
}

// ============ 统计函数 ============

/**
 * 获取用户的订单统计
 */
export async function getUserOrderStats(userId: string): Promise<{
  totalOrders: number;
  totalSpent: number;
  totalCredits: number;
  paidOrders: number;
}> {
  const orders = await listUserOrders(userId);
  const paidOrders = orders.filter(o => o.status === "paid");
  
  return {
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    totalSpent: paidOrders.reduce((sum, order) => {
      // 优先用 amount（分），否则用 amountCny（元）* 100
      const cents = order.amount ?? (order.amountCny ? order.amountCny * 100 : 0);
      return sum + cents;
    }, 0) / 100, // 返回元
    totalCredits: paidOrders
      .filter(o => o.type === "credits" || o.type === "credits-pack")
      .reduce((sum, order) => sum + (order.creditsChange || 0), 0)
  };
}

/**
 * 获取待支付订单（用于清理或提醒）
 */
export async function getPendingOrders(userId?: string): Promise<Order[]> {
  const orders = await loadOrders();
  const pending = orders.filter(o => o.status === "pending");
  
  if (userId) {
    return pending.filter(o => o.userId === userId);
  }
  
  return pending;
}
