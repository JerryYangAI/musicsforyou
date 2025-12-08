/**
 * Billing API 路由
 * 
 * 处理会员订阅和 Credits 购买相关接口
 * 支持真实 Stripe 支付和模拟支付
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import Stripe from "stripe";
import { requireAuth } from "./auth";
import userStore, { getUserPublicInfo, type User } from "./userStore";
import * as billingStore from "./billingStore";
import {
  MEMBERSHIP_PLANS,
  CREDIT_PACKS,
  GUEST_CONFIG,
  getPlanById,
  getCreditPackById,
} from "./billingConfig";

const router = Router();

// ============ Stripe 客户端 ============

// 延迟初始化 Stripe
let stripeInstance: Stripe | null = null;

/**
 * 获取 Stripe 客户端实例
 */
function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.NODE_ENV === "production"
      ? process.env.STRIPE_SECRET_KEY
      : process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error("Missing Stripe secret key. Please set STRIPE_SECRET_KEY in .env");
    }
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-09-30.clover",
    });
  }
  return stripeInstance;
}

// ============ 价格配置 ============

// Pro 会员月费：19.9 元 = 1990 分
const PRO_PRICE_CENTS = 1990;

// Credits 套餐配置
const CREDITS_PACKS_CONFIG: Record<string, { amount: number; credits: number }> = {
  "CREDITS_10": { amount: 990, credits: 10 },   // 10 首 9.9 元
  "CREDITS_30": { amount: 2490, credits: 30 },  // 30 首 24.9 元
  "pack-10": { amount: 990, credits: 10 },      // 兼容新配置
  "pack-30": { amount: 2490, credits: 30 },     // 兼容新配置
};

// ============ GET /api/billing/plans ============

/**
 * 获取会员方案和 Credits 套餐列表
 * 
 * 返回:
 * - plans: 按 sortOrder 排序的会员计划
 * - creditPacks: Credits 扩展包
 * - guestConfig: 游客配置
 * - currentUser: 当前用户信息（如已登录）
 */
router.get("/plans", async (req: Request, res: Response) => {
  try {
    // 按 sortOrder 排序
    const sortedPlans = [...MEMBERSHIP_PLANS].sort((a, b) => a.sortOrder - b.sortOrder);
    
    // 获取当前用户信息（如已登录）
    let currentUser = null;
    if ((req as any).authUser) {
      const user = await userStore.getUserById((req as any).authUser.id);
      if (user) {
        currentUser = {
          plan: user.plan,
          extraCredits: user.extraCredits,
          planExpiresAt: user.planExpiresAt,
        };
      }
    }

    res.json({
      success: true,
      plans: sortedPlans,
      creditPacks: CREDIT_PACKS,
      guestConfig: GUEST_CONFIG,
      currentUser,
    });
  } catch (error) {
    console.error("[Billing] 获取方案列表失败:", error);
    res.status(500).json({
      success: false,
      error: "获取方案列表失败",
    });
  }
});

// ============ GET /api/billing/credit-packs ============

/**
 * 获取 Credits 扩展包列表（独立接口）
 */
router.get("/credit-packs", async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      creditPacks: CREDIT_PACKS,
    });
  } catch (error) {
    console.error("[Billing] 获取 Credits 套餐失败:", error);
    res.status(500).json({
      success: false,
      error: "获取 Credits 套餐失败",
    });
  }
});

// ============ POST /api/billing/upgrade-to-pro (& /mock-buy-pro) ============

/**
 * 升级为 Pro 会员 / 模拟购买 Pro 会员
 * 
 * - 仅允许已登录用户
 * - 如果已是 Pro/VIP/Admin，返回 alreadyPro: true
 * - 将 user.plan 设置为 "pro"
 * - 设置/叠加 30 天有效期
 * - 写入一条订单记录
 * 
 * TODO: 接入真实支付后，在这里验证支付成功后再执行升级逻辑
 */
async function handleUpgradeToPro(req: Request, res: Response) {
  try {
    const userId = req.authUser!.id;
    const user = await userStore.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        error: "用户不存在",
      });
    }

    const proPlan = getPlanById("pro");
    if (!proPlan) {
      return res.status(500).json({
        success: false,
        error: "Pro 方案配置不存在",
      });
    }

    const now = new Date();
    let newExpiresAt: Date;

    // 如果用户已经是 Pro 且还有有效期，则叠加 30 天
    if (user.plan === "pro" && user.planExpiresAt) {
      const currentExpires = new Date(user.planExpiresAt);
      if (currentExpires > now) {
        // 从当前过期时间叠加 30 天
        newExpiresAt = new Date(currentExpires);
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);
        console.log(`[Billing] 用户 ${userId} 续费 Pro，叠加 30 天`);
      } else {
        // 已过期，从现在开始算
        newExpiresAt = new Date(now);
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);
      }
    } else {
      // 新购买，从现在开始算 30 天
      newExpiresAt = new Date(now);
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);
    }

    // 更新用户信息
    user.plan = "pro";
    user.planStartedAt = now.toISOString();
    user.planExpiresAt = newExpiresAt.toISOString();
    await userStore.updateUser(user);

    // 创建订单记录
    const order = await billingStore.createOrder({
      userId: user.id,
      type: "pro-subscription",
      planId: "pro",
      amountCny: proPlan.priceCny,
      creditsChange: 0,
      meta: {
        previousPlan: req.authUser!.plan,
        newExpiresAt: newExpiresAt.toISOString(),
      },
    });

    console.log(`[Billing] 用户 ${userId} 购买 Pro 成功，订单: ${order.id}, 有效期至: ${newExpiresAt.toISOString()}`);

    res.json({
      success: true,
      message: "成功升级为 Pro 会员",
      alreadyPro: false,
      user: {
        ...getUserPublicInfo(user),
        planExpiresAt: user.planExpiresAt,
      },
      order: {
        id: order.id,
        amountCny: order.amountCny,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("[Billing] 购买 Pro 失败:", error);
    res.status(500).json({
      success: false,
      error: "购买失败，请稍后重试",
    });
  }
}

// 绑定路由（两个端点指向同一个处理函数）
router.post("/upgrade-to-pro", requireAuth, handleUpgradeToPro);
router.post("/mock-buy-pro", requireAuth, handleUpgradeToPro);

// ============ POST /api/billing/buy-credits (& /mock-buy-credits) ============

const buyCreditsSchema = z.object({
  packId: z.string().min(1, "packId 不能为空"),
});

/**
 * 购买 Credits 套餐 / 模拟购买 Credits 套餐
 * 
 * - 仅允许已登录用户
 * - 仅当 plan === "pro" | "vip" | "admin" 时允许购买
 * - 增加 extraCredits
 * - 写入订单记录
 * 
 * TODO: 接入真实支付后，在这里验证支付成功后再执行增加 credits 逻辑
 */
async function handleBuyCredits(req: Request, res: Response) {
  try {
    const userId = req.authUser!.id;
    const user = await userStore.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        error: "用户不存在",
      });
    }

    // 检查是否为 Pro 用户
    if (user.plan !== "pro" && user.plan !== "admin") {
      return res.status(403).json({
        success: false,
        code: "NOT_PRO_USER",
        error: "只有 Pro 会员才能购买额外 Credits",
      });
    }

    // 验证请求参数
    const parseResult = buyCreditsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PARAMS",
        error: parseResult.error.errors[0]?.message || "参数无效",
      });
    }

    const { packId } = parseResult.data;
    const pack = getCreditPackById(packId);

    if (!pack) {
      return res.status(400).json({
        success: false,
        code: "PACK_NOT_FOUND",
        error: "Credits 套餐不存在",
      });
    }

    // 增加 extraCredits
    const previousCredits = user.extraCredits;
    await userStore.addExtraCredits(userId, pack.credits);

    // 重新获取更新后的用户信息
    const updatedUser = await userStore.getUserById(userId);

    // 创建订单记录
    const order = await billingStore.createOrder({
      userId: user.id,
      type: "credits-pack",
      packId: packId,
      amountCny: pack.priceCny,
      creditsChange: pack.credits,
      meta: {
        previousCredits,
        newCredits: updatedUser?.extraCredits,
      },
    });

    console.log(`[Billing] 用户 ${userId} 购买 Credits 成功，订单: ${order.id}, 增加: ${pack.credits}`);

    res.json({
      success: true,
      message: `成功购买 ${pack.credits} 首额外 Credits`,
      extraCredits: updatedUser?.extraCredits ?? 0,
      pack: {
        id: pack.id,
        name: pack.name,
        credits: pack.credits,
      },
      user: {
        ...getUserPublicInfo(updatedUser!),
        planExpiresAt: updatedUser?.planExpiresAt,
      },
      order: {
        id: order.id,
        amountCny: order.amountCny,
        creditsChange: order.creditsChange,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("[Billing] 购买 Credits 失败:", error);
    res.status(500).json({
      success: false,
      error: "购买失败，请稍后重试",
    });
  }
}

// 绑定路由（两个端点指向同一个处理函数）
router.post("/buy-credits", requireAuth, handleBuyCredits);
router.post("/mock-buy-credits", requireAuth, handleBuyCredits);

// ============ POST /api/billing/create-pro-payment-intent ============

/**
 * 创建 Pro 会员支付 PaymentIntent
 * 
 * 真实 Stripe 支付流程：
 * 1. 创建 PaymentIntent
 * 2. 创建订单记录（status=pending）
 * 3. 返回 clientSecret 给前端完成支付
 * 4. Webhook 收到支付成功后更新用户状态
 */
router.post("/create-pro-payment-intent", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.authUser;
    if (!user) {
      return res.status(401).json({ success: false, code: "UNAUTHORIZED", error: "未登录" });
    }

    const paymentMethod = (req.body?.paymentMethod as "card" | "wechat" | "alipay" | undefined) || "card";
    const amount = PRO_PRICE_CENTS;
    const currency = "cny";

    const stripe = getStripe();

    // 配置 payment_method_types
    let paymentMethodTypes: Stripe.PaymentIntentCreateParams.PaymentMethodType[] = [];
    if (paymentMethod === "wechat") {
      paymentMethodTypes = ["wechat_pay"];
    } else if (paymentMethod === "alipay") {
      paymentMethodTypes = ["alipay"];
    } else {
      paymentMethodTypes = ["card", "wechat_pay", "alipay"];
    }

    // 创建 PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: paymentMethodTypes,
      payment_method_configuration: process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION || undefined,
      metadata: {
        userId: user.id,
        billingType: "pro",
      },
    });

    // 创建订单记录（status=pending）
    const order = await billingStore.createOrder({
      userId: user.id,
      type: "pro",
      amount,
      currency,
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
      meta: {
        paymentMethod,
        currentPlan: user.plan,
      },
    });

    // 更新 PaymentIntent metadata 加入 orderId
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        userId: user.id,
        billingType: "pro",
        orderId: order.id,
      },
    });

    console.log(`[Billing] 创建 Pro PaymentIntent: ${paymentIntent.id}, 订单: ${order.id}, 用户: ${user.id}`);

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      amount,
      currency,
    });
  } catch (err: any) {
    console.error("[Billing] create-pro-payment-intent error:", err);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      error: err.message || "创建支付失败",
    });
  }
});

// ============ POST /api/billing/create-credits-payment-intent ============

/**
 * 创建 Credits 支付 PaymentIntent
 * 
 * 真实 Stripe 支付流程：
 * 1. 验证套餐 ID
 * 2. 创建 PaymentIntent
 * 3. 创建订单记录（status=pending）
 * 4. 返回 clientSecret 给前端完成支付
 * 5. Webhook 收到支付成功后增加用户 extraCredits
 */
router.post("/create-credits-payment-intent", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.authUser;
    if (!user) {
      return res.status(401).json({ success: false, code: "UNAUTHORIZED", error: "未登录" });
    }

    const packId = (req.body?.packId as string) || "CREDITS_10";
    const paymentMethod = (req.body?.paymentMethod as "card" | "wechat" | "alipay" | undefined) || "card";
    const currency = "cny";

    // 查找套餐配置
    const packConfig = CREDITS_PACKS_CONFIG[packId];
    if (!packConfig) {
      return res.status(400).json({
        success: false,
        code: "UNKNOWN_PACK",
        error: `未知的套餐: ${packId}`,
      });
    }

    const { amount, credits } = packConfig;
    const stripe = getStripe();

    // 配置 payment_method_types
    let paymentMethodTypes: Stripe.PaymentIntentCreateParams.PaymentMethodType[] = [];
    if (paymentMethod === "wechat") {
      paymentMethodTypes = ["wechat_pay"];
    } else if (paymentMethod === "alipay") {
      paymentMethodTypes = ["alipay"];
    } else {
      paymentMethodTypes = ["card", "wechat_pay", "alipay"];
    }

    // 创建 PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: paymentMethodTypes,
      payment_method_configuration: process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION || undefined,
      metadata: {
        userId: user.id,
        billingType: "credits",
        packId,
        credits: credits.toString(),
      },
    });

    // 创建订单记录（status=pending）
    const order = await billingStore.createOrder({
      userId: user.id,
      type: "credits",
      creditsPackId: packId,
      amount,
      currency,
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
      creditsChange: credits,
      meta: {
        paymentMethod,
        packId,
        credits,
      },
    });

    // 更新 PaymentIntent metadata 加入 orderId
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        userId: user.id,
        billingType: "credits",
        packId,
        credits: credits.toString(),
        orderId: order.id,
      },
    });

    console.log(`[Billing] 创建 Credits PaymentIntent: ${paymentIntent.id}, 订单: ${order.id}, 用户: ${user.id}, 套餐: ${packId}`);

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      amount,
      currency,
      packId,
      credits,
    });
  } catch (err: any) {
    console.error("[Billing] create-credits-payment-intent error:", err);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      error: err.message || "创建支付失败",
    });
  }
});

// ============ GET /api/billing/orders ============

/**
 * 获取当前用户的订单列表
 */
router.get("/orders", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser!.id;
    const orders = await billingStore.listUserOrders(userId);
    const stats = await billingStore.getUserOrderStats(userId);

    res.json({
      success: true,
      orders,
      stats,
    });
  } catch (error) {
    console.error("[Billing] 获取订单列表失败:", error);
    res.status(500).json({
      success: false,
      error: "获取订单列表失败",
    });
  }
});

// ============ DEV ONLY: 开发测试工具 ============

if (process.env.NODE_ENV !== "production") {
  /**
   * [DEV] 设置用户为 Pro 并赠送 Credits
   */
  router.post("/dev/set-pro-with-credits", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.authUser!.id;
      const user = await userStore.getUserById(userId);

      if (!user) {
        return res.status(404).json({ success: false, error: "用户不存在" });
      }

      const credits = req.body.credits ?? 30;
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      user.plan = "pro";
      user.planStartedAt = now.toISOString();
      user.planExpiresAt = expiresAt.toISOString();
      user.extraCredits = credits;
      await userStore.updateUser(user);

      console.log(`[DEV] 设置用户 ${userId} 为 Pro，extraCredits: ${credits}`);

      res.json({
        success: true,
        message: `已设置为 Pro 会员，extraCredits: ${credits}`,
        user: {
          ...getUserPublicInfo(user),
          planExpiresAt: user.planExpiresAt,
        },
      });
    } catch (error) {
      console.error("[DEV] 设置用户失败:", error);
      res.status(500).json({ success: false, error: "操作失败" });
    }
  });

  /**
   * [DEV] 清空用户 extraCredits
   */
  router.post("/dev/clear-credits", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.authUser!.id;
      const user = await userStore.getUserById(userId);

      if (!user) {
        return res.status(404).json({ success: false, error: "用户不存在" });
      }

      user.extraCredits = 0;
      await userStore.updateUser(user);

      console.log(`[DEV] 清空用户 ${userId} 的 extraCredits`);

      res.json({
        success: true,
        message: "已清空 extraCredits",
        user: getUserPublicInfo(user),
      });
    } catch (error) {
      console.error("[DEV] 清空 Credits 失败:", error);
      res.status(500).json({ success: false, error: "操作失败" });
    }
  });

  /**
   * [DEV] 重置用户为 Free
   */
  router.post("/dev/reset-to-free", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.authUser!.id;
      const user = await userStore.getUserById(userId);

      if (!user) {
        return res.status(404).json({ success: false, error: "用户不存在" });
      }

      user.plan = "free";
      user.planStartedAt = null;
      user.planExpiresAt = null;
      user.extraCredits = 0;
      await userStore.updateUser(user);

      console.log(`[DEV] 重置用户 ${userId} 为 Free`);

      res.json({
        success: true,
        message: "已重置为免费用户",
        user: getUserPublicInfo(user),
      });
    } catch (error) {
      console.error("[DEV] 重置用户失败:", error);
      res.status(500).json({ success: false, error: "操作失败" });
    }
  });
}

export default router;

