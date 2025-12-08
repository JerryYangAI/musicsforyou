import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { z } from "zod";
import Stripe from "stripe";
import { insertOrderSchema, insertReviewSchema, insertMusicTrackSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { sendOrderNotification } from "./emailService";
import {
  generateMusic,
  fetchMusicResult,
  SunoApiError,
  type GenerateMusicParams,
} from "./sunoApiClient";
import trackStore, { type Track, getQuotaStats, getMonthlyCount, updateTrackCover } from "./trackStore";
import { optimizePrompt } from "./promptOptimizer";
import { generateCoverArtForTrack } from "./coverArtGenerator";

// 新用户系统
import authRoutes from "./authRoutes";
import userStore, { type User, type UserPlan, getUserPublicInfo, decrementExtraCredit } from "./userStore";

// Billing 系统
import billingRoutes from "./billingRoutes";
import * as billingStore from "./billingStore";
import { MEMBERSHIP_PLANS, GUEST_CONFIG, getPlanById } from "./billingConfig";
import { attachUserIfExists, ensureGuestIdCookie } from "./auth";

const ROUTES_DEBUG = process.env.ROUTES_DEBUG === "1" || process.env.NODE_ENV === "development";
const routesLog = (...args: unknown[]): void => {
  if (ROUTES_DEBUG) {
    console.log(...args);
  }
};

routesLog("[routes] module evaluation start");

// Use test key in development, production key in production
// Stripe密钥是可选的，只有在实际使用支付功能时才需要
const stripeSecretKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_SECRET_KEY 
  : process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

// 延迟初始化Stripe，只有在实际使用时才检查密钥
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!stripeSecretKey) {
      throw new Error('Missing required Stripe secret key. Please set STRIPE_SECRET_KEY or TESTING_STRIPE_SECRET_KEY in .env');
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-09-30.clover",
    });
  }
  return stripe;
}

// Admin middleware
async function requireAdmin(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
}

routesLog("[routes] registerRoutes definition ready");

export async function registerRoutes(app: Express): Promise<Server> {
  routesLog("[routes] registerRoutes start");
  
  // 应用新的认证中间件（附加用户信息到 req.authUser）
  app.use(attachUserIfExists);
  
  // 新的认证路由（支持手机号/邮箱注册登录）
  // 使用 /api/auth-v2 前缀避免与旧的 session 认证冲突
  app.use("/api/auth-v2", authRoutes);
  
  // Billing 路由（会员订阅、Credits 购买）
  app.use("/api/billing", billingRoutes);
  
  // Registration endpoint (legacy - username based)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      // Store user in session
      req.session.userId = user.id;

      res.json({ 
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Find user by username
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Store user in session
      req.session.userId = user.id;

      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Change password endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      // Check if new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({ error: "New password must be different from current password" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  
  // Get public music tracks for the leaderboard (showcase tracks first)
  app.get("/api/music/public", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tracks = await storage.getPublicMusicTracks(limit);
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching music tracks:", error);
      res.status(500).json({ error: "Failed to fetch music tracks" });
    }
  });

  // ============ Suno API 音乐生成接口 ============

  // 参数校验 Schema
  const generateMusicSchema = z.object({
    prompt: z.string().min(1, "prompt 不能为空"),
    title: z.string().optional(),
    model: z.string().optional(), // 新的模型字段：V3_5, V4, V4_5, V4_5ALL, V4_5PLUS, V5
    mv: z.string().nullable().optional(), // 兼容旧的 mv 字段
    instrumental: z.boolean().optional().default(false),
  });

  // 额度配置 - 从 billingConfig 读取
  const GUEST_DAILY_LIMIT = GUEST_CONFIG.dailyLimit;  // 游客每日限额
  const freePlan = getPlanById("free");
  const proPlan = getPlanById("pro");
  const FREE_MONTHLY_LIMIT = freePlan?.monthlyLimit ?? 3;   // 免费用户每月限额
  const PRO_MONTHLY_LIMIT = proPlan?.monthlyLimit ?? 30;   // 付费会员每月配额

  /**
   * POST /api/music/generate
   * 提交生成歌曲任务
   *
   * 额度规则:
   * - guest（未登录游客）: 每日最多 1 首，仅试听不可下载
   * - free（注册用户）: 每月最多 3 首，可下载
   * - pro（付费会员）: 每月 30 首配额，超过后使用 extraCredits
   * - vip/admin: 无限制
   *
   * 请求体:
   * {
   *   "prompt": "string",       // 必填，生成音乐的文案提示词
   *   "title": "string",        // 可选，歌曲标题
   *   "model": "string",        // 可选，模型版本
   *   "instrumental": boolean   // 可选，是否纯伴奏，默认 false
   * }
   *
   * 返回:
   * {
   *   "success": true,
   *   "taskId": "string",
   *   "raw": { ... }
   * }
   */
  app.post("/api/music/generate", async (req, res) => {
    try {
      // 用于记录 Track 的用户 ID
      let userIdForTrack: string;
      // 用户计划类型
      let userPlan: "guest" | UserPlan;
      // 新用户系统的用户对象
      let authUser: User | null = null;

      // ============ 额度控制逻辑 ============

      if (!req.authUser) {
        // 未登录 → guest（使用 Cookie 标识游客）
        const guestId = ensureGuestIdCookie(req, res);
        const todayCount = await trackStore.getTodayCount(guestId);
        
        if (todayCount >= GUEST_DAILY_LIMIT) {
          console.log(`[API] 游客 ${guestId} 今日生成次数已达上限: ${todayCount}/${GUEST_DAILY_LIMIT}`);
          return res.status(429).json({
            success: false,
            code: "DAILY_LIMIT_GUEST",
            error: "游客每日仅可生成 1 首，请注册后获得更多额度。",
            todayCount,
            dailyLimit: GUEST_DAILY_LIMIT,
          });
        }
        
        userIdForTrack = guestId;
        userPlan = "guest";
      } else {
        // 已登录用户
        const user = await userStore.getUserById(req.authUser.id);
        
        if (!user) {
          // 用户不存在（防御性处理）
          return res.status(401).json({
            success: false,
            code: "USER_NOT_FOUND",
            error: "用户不存在，请重新登录",
          });
        }
        
        authUser = user;
        userIdForTrack = user.id;
        userPlan = user.plan;
        
        const monthlyCount = await getMonthlyCount(user.id);
        
        if (userPlan === "free") {
          // 免费用户：每月 3 首
          if (monthlyCount >= FREE_MONTHLY_LIMIT) {
            console.log(`[API] 免费用户 ${user.id} 本月额度已用完: ${monthlyCount}/${FREE_MONTHLY_LIMIT}`);
            return res.status(429).json({
              success: false,
              code: "MONTHLY_LIMIT_FREE",
              error: `本月免费额度已用完（${FREE_MONTHLY_LIMIT} 首/月），升级会员可获得每月 ${PRO_MONTHLY_LIMIT} 首生成额度。`,
              monthlyCount,
              monthlyLimit: FREE_MONTHLY_LIMIT,
            });
          }
        } else if (userPlan === "pro") {
          // Pro 会员：每月 30 首配额，超过后使用 extraCredits
          if (monthlyCount >= PRO_MONTHLY_LIMIT) {
            // 检查 extraCredits
            if (user.extraCredits > 0) {
              // 扣减积分
              const success = await decrementExtraCredit(user.id);
              if (!success) {
                return res.status(402).json({
                  success: false,
                  code: "NEED_TOPUP",
                  error: "本月内含 30 首和已有 Credits 均已用完，请购买额外生成次数。",
                  monthlyCount,
                  extraCredits: user.extraCredits,
                });
              }
              console.log(`[API] Pro 用户 ${user.id} 使用 extraCredits，剩余: ${user.extraCredits - 1}`);
            } else {
              console.log(`[API] Pro 用户 ${user.id} 本月配额和 Credits 已用完`);
              return res.status(402).json({
                success: false,
                code: "NEED_TOPUP",
                error: "本月内含 30 首和已有 Credits 均已用完，请购买额外生成次数。",
                monthlyCount,
                extraCredits: user.extraCredits,
              });
            }
          }
        }
        // vip/admin 暂时不做限制
      }

      // ============ 参数校验 ============
      
      const parseResult = generateMusicSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors
          .map((e) => e.message)
          .join(", ");
        return res.status(400).json({
          success: false,
          error: `参数校验失败: ${errorMsg}`,
        });
      }

      const params: GenerateMusicParams = {
        prompt: parseResult.data.prompt,
        title: parseResult.data.title,
        model: parseResult.data.model,
        mv: parseResult.data.mv ?? undefined,
        instrumental: parseResult.data.instrumental,
      };

      // ============ 调用 Suno API ============
      
      const result = await generateMusic(params);

      // 记录用于保存 Track 时的用户 ID（存储到临时上下文，稍后在 result 接口中使用）
      // 由于是异步任务，我们通过 taskId 关联
      console.log(`[API] 音乐生成任务已提交: taskId=${result.taskId}, userId=${userIdForTrack}, plan=${userPlan}`);

      res.json({
        success: true,
        taskId: result.taskId,
        userId: userIdForTrack, // 返回给前端，用于后续 track 保存
        userPlan,
        raw: result.raw,
      });
    } catch (error) {
      console.error("[API] /api/music/generate error:", error);

      if (error instanceof SunoApiError) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: `生成音乐失败: ${(error as Error).message}`,
      });
    }
  });

  /**
   * GET /api/music/result?taskId=xxx
   * 根据 taskId 查询生成结果
   *
   * 查询参数:
   * - taskId: string (必填)
   *
   * 返回:
   * {
   *   "success": true,
   *   "status": "pending | generating | finished | failed",
   *   "audioUrl": "string | null",         // 主要音频 URL
   *   "sourceAudioUrl": "string | null",   // 源音频 URL（备选）
   *   "imageUrl": "string | null",         // 封面图片 URL
   *   "sourceImageUrl": "string | null",   // 源图片 URL（备选）
   *   "videoUrl": "string | null",         // 视频 URL
   *   "sourceVideoUrl": "string | null",   // 源视频 URL（备选）
   *   "title": "string | null",            // 歌曲标题
   *   "prompt": "string | null",           // 生成提示词
   *   "duration": number | null,           // 时长（秒）
   *   "tags": "string | null",             // 风格标签
   *   "modelName": "string | null",        // 使用的模型
   *   "raw": { ... }
   * }
   *
   * 状态映射逻辑：
   * - 如果 sunoData 中存在非空 audioUrl，则 status 为 "finished"
   * - 否则根据原始状态：PENDING -> "pending", TEXT_SUCCESS/FIRST_SUCCESS -> "generating", 错误状态 -> "failed"
   */
  app.get("/api/music/result", async (req, res) => {
    try {
      const taskId = req.query.taskId as string;

      if (!taskId || taskId.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "taskId 参数不能为空",
        });
      }

      // 调用 Suno API 查询结果
      const result = await fetchMusicResult(taskId);

      // 当生成完成且有音频 URL 时，保存到 Track 存储
      if (result.status === "finished" && result.audioUrl) {
        try {
          // 先检查是否已存在（幂等性）
          const existingTrack = await trackStore.getTrackByTaskId(taskId);
          
          if (!existingTrack) {
            // 获取用户 ID（优先使用新认证系统，其次使用 session，最后使用 guest cookie）
            let userId: string;
            if (req.authUser) {
              userId = req.authUser.id;
            } else if (req.session?.userId) {
              userId = req.session.userId;
            } else {
              userId = req.cookies?.["guest_id"] || "guest";
            }

            // 组装 Track 对象
            const track: Track = {
              id: taskId,
              taskId: taskId,
              title: result.title || "未命名作品",
              prompt: result.prompt || "",
              audioUrl: result.audioUrl,
              imageUrl: result.imageUrl || null,
              duration: result.duration || null,
              tags: result.tags || null,
              modelName: result.modelName || null,
              createdAt: new Date().toISOString(),
              userId,
              isPublic: true,  // 默认公开
            };

            // 保存到存储
            await trackStore.saveTrack(track);
            console.log(`[API] Track 已保存: taskId=${taskId}, userId=${userId}`);

            // 异步触发封面生成（不阻塞响应）
            // 仅对 Pro/VIP/Admin 用户生成高质量封面
            generateCoverArtForTrack(track)
              .then(async (coverUrl) => {
                if (coverUrl) {
                  await updateTrackCover(track.id, coverUrl);
                  console.log(`[API] Track 封面已更新: taskId=${taskId}, coverUrl=${coverUrl}`);
                }
              })
              .catch((err) => {
                console.error("[API] 异步封面生成错误:", err);
              });
          }
        } catch (saveError) {
          // 保存失败不影响正常响应，只记录日志
          console.error("[API] 保存 Track 失败:", saveError);
        }
      }

      res.json({
        success: true,
        status: result.status,
        // 音频 URL
        audioUrl: result.audioUrl,
        sourceAudioUrl: result.sourceAudioUrl,
        // 图片 URL
        imageUrl: result.imageUrl,
        sourceImageUrl: result.sourceImageUrl,
        // 视频 URL
        videoUrl: result.videoUrl,
        sourceVideoUrl: result.sourceVideoUrl,
        // 元数据
        title: result.title,
        prompt: result.prompt,
        duration: result.duration,
        tags: result.tags,
        modelName: result.modelName,
        // 原始数据
        raw: result.raw,
      });
    } catch (error) {
      console.error("[API] /api/music/result error:", error);

      if (error instanceof SunoApiError) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: `查询生成结果失败: ${(error as Error).message}`,
      });
    }
  });

  /**
   * POST /api/music/webhook
   * SunoAPI 回调端点
   * 
   * 当 SunoAPI 生成任务完成时，会向此地址发送 POST 请求
   * 包含生成结果数据
   * 
   * 注意：生产环境需要配置 SUNOAPI_CALLBACK_URL 为公网可访问的 HTTPS 地址
   */
  app.post("/api/music/webhook", async (req, res) => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[SunoAPI Webhook] ${timestamp} 收到回调请求`);
      console.log(`[SunoAPI Webhook] Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[SunoAPI Webhook] Body:`, JSON.stringify(req.body, null, 2));

      // TODO: 在这里处理回调数据
      // 例如：更新订单状态、保存生成的音乐文件等
      // const { taskId, status, audioUrl, ... } = req.body;

      // 返回 200 表示回调处理成功
      res.status(200).json({
        success: true,
        message: "Webhook received",
        timestamp,
      });
    } catch (error) {
      console.error("[SunoAPI Webhook] 处理回调失败:", error);
      // 即使处理失败也返回 200，避免 SunoAPI 重复发送回调
      res.status(200).json({
        success: false,
        error: "Webhook processing failed",
      });
    }
  });

  // ============ Prompt 优化接口 ============

  // 参数校验 Schema
  const optimizePromptSchema = z.object({
    rawPrompt: z.string().min(1, "rawPrompt 不能为空"),
    language: z.enum(["zh", "en"]).optional().default("zh"),
    title: z.string().optional(),
    stylePresetId: z.string().nullable().optional(),
  });

  /**
   * POST /api/prompt/optimize
   * 使用 OpenAI GPT 优化用户的音乐生成提示词
   *
   * 请求体:
   * {
   *   "rawPrompt": "string",       // 必填，用户原始输入的提示词
   *   "language": "zh" | "en",     // 可选，输出语言，默认 zh
   *   "title": "string",           // 可选，歌曲标题
   *   "stylePresetId": "string"    // 可选，当前选中的风格预设 ID
   * }
   *
   * 返回:
   * {
   *   "success": true,
   *   "optimizedPrompt": "string"
   * }
   */
  app.post("/api/prompt/optimize", async (req, res) => {
    try {
      // 检查 OpenAI API Key 配置
      if (!process.env.OPENAI_API_KEY) {
        console.error("[PromptOptimize] OPENAI_API_KEY is not configured");
        return res.status(500).json({
          success: false,
          error: "OPENAI_API_KEY_NOT_CONFIGURED",
          message: "服务未配置 OpenAI API，暂时无法使用提示词优化功能",
        });
      }

      // 参数校验
      const parseResult = optimizePromptSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
        return res.status(400).json({
          success: false,
          error: "INVALID_PARAMS",
          message: errorMsg,
        });
      }

      const { rawPrompt, language, title, stylePresetId } = parseResult.data;

      console.log(`[PromptOptimize] 开始优化提示词: "${rawPrompt.substring(0, 30)}..."`);

      // 调用优化函数
      const optimizedPrompt = await optimizePrompt({
        rawPrompt,
        language,
        title,
        stylePresetId,
      });

      console.log(`[PromptOptimize] 优化完成，结果长度: ${optimizedPrompt.length}`);

      res.json({
        success: true,
        optimizedPrompt,
      });
    } catch (error: any) {
      console.error("[PromptOptimize] 优化失败:", error);
      res.status(500).json({
        success: false,
        error: "PROMPT_OPTIMIZE_FAILED",
        message: error.message || "提示词优化失败，请稍后重试",
      });
    }
  });

  /**
   * GET /api/music/stats
   * 获取用户的音乐生成统计数据和额度信息
   *
   * 返回:
   * {
   *   "success": true,
   *   "todayCount": number,      // 今日已生成数量
   *   "monthlyCount": number,    // 本月已生成数量
   *   "totalCount": number,      // 总生成数量
   *   "plan": string,            // 用户计划: guest/free/pro/vip/admin
   *   "dailyLimit": number | null,   // 每日限额（仅游客）
   *   "monthlyLimit": number | null, // 每月限额（免费/会员）
   *   "extraCredits": number,    // 额外积分
   *   "remaining": number,       // 剩余次数（根据 plan 计算）
   *   "canDownload": boolean,    // 是否可下载
   * }
   */
  app.get("/api/music/stats", async (req, res) => {
    try {
      let userId: string;
      let plan: "guest" | UserPlan;
      let extraCredits = 0;
      let dailyLimit: number | null = null;
      let monthlyLimit: number | null = null;
      let canDownload = false;

      if (req.authUser) {
        // 新认证系统登录的用户
        const user = await userStore.getUserById(req.authUser.id);
        if (!user) {
          return res.json({ success: true, user: null });
        }
        userId = user.id;
        plan = user.plan;
        extraCredits = user.extraCredits;
        canDownload = true;

        if (plan === "free") {
          monthlyLimit = FREE_MONTHLY_LIMIT;
        } else if (plan === "pro") {
          monthlyLimit = PRO_MONTHLY_LIMIT;
        }
        // vip/admin 无限制
      } else {
        // 未登录 → 游客
        userId = req.cookies?.["guest_id"] || "guest";
        plan = "guest";
        dailyLimit = GUEST_DAILY_LIMIT;
        canDownload = false;
      }

      const stats = await getQuotaStats(userId);

      // 计算剩余次数
      let remaining = 0;
      if (plan === "guest") {
        remaining = Math.max(0, GUEST_DAILY_LIMIT - stats.todayCount);
      } else if (plan === "free") {
        remaining = Math.max(0, FREE_MONTHLY_LIMIT - stats.monthlyCount);
      } else if (plan === "pro") {
        // Pro 用户剩余 = 月度配额剩余 + extraCredits
        remaining = Math.max(0, PRO_MONTHLY_LIMIT - stats.monthlyCount) + extraCredits;
      } else {
        // vip/admin 无限制
        remaining = 9999;
      }

      res.json({
        success: true,
        todayCount: stats.todayCount,
        monthlyCount: stats.monthlyCount,
        totalCount: stats.totalCount,
        plan,
        dailyLimit,
        monthlyLimit,
        extraCredits,
        remaining,
        canDownload,
      });
    } catch (error) {
      console.error("[API] /api/music/stats error:", error);
      res.status(500).json({
        success: false,
        error: `获取统计数据失败: ${(error as Error).message}`,
      });
    }
  });

  /**
   * GET /api/music/tracks
   * 获取用户的作品列表
   *
   * 查询参数:
   * - page: number (可选，默认 1)
   * - pageSize: number (可选，默认 20)
   *
   * 返回:
   * {
   *   "success": true,
   *   "items": [{ id, title, prompt, audioUrl, imageUrl, duration, tags, modelName, createdAt }, ...],
   *   "total": number,
   *   "page": number,
   *   "pageSize": number,
   *   "totalPages": number
   * }
   */
  app.get("/api/music/tracks", async (req, res) => {
    try {
      // 获取用户 ID（优先使用新认证系统）
      let userId: string;
      if (req.authUser) {
        userId = req.authUser.id;
      } else if (req.session?.userId) {
        userId = req.session.userId;
      } else {
        userId = req.cookies?.["guest_id"] || "guest";
      }

      // 解析分页参数
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

      // 获取分页数据
      const result = await trackStore.getTracksPaginated(userId, page, pageSize);

      res.json({
        success: true,
        items: result.items.map((track) => ({
          id: track.id,
          title: track.title,
          prompt: track.prompt,
          audioUrl: track.audioUrl,
          imageUrl: track.imageUrl,
          duration: track.duration,
          tags: track.tags,
          modelName: track.modelName,
          createdAt: track.createdAt,
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error("[API] /api/music/tracks error:", error);
      res.status(500).json({
        success: false,
        error: `获取作品列表失败: ${(error as Error).message}`,
      });
    }
  });

  /**
   * GET /api/music/tracks/:id
   * 获取单条作品详情
   *
   * 路径参数:
   * - id: string (Track ID)
   *
   * 返回:
   * {
   *   "success": true,
   *   "track": { id, title, prompt, audioUrl, imageUrl, duration, tags, modelName, createdAt, ... }
   * }
   */
  app.get("/api/music/tracks/:id", async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || id.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Track ID 不能为空",
        });
      }

      // 根据 ID 查找 Track
      const track = await trackStore.getTrackById(id);

      if (!track) {
        return res.status(404).json({
          success: false,
          error: "作品不存在",
        });
      }

      // 检查访问权限（公开作品或者是自己的作品）
      const userId = req.authUser?.id || req.session?.userId || req.cookies?.["guest_id"] || "guest";
      if (!track.isPublic && track.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "无权访问该作品",
        });
      }

      res.json({
        success: true,
        track: {
          id: track.id,
          taskId: track.taskId,
          title: track.title,
          prompt: track.prompt,
          audioUrl: track.audioUrl,
          imageUrl: track.imageUrl,
          duration: track.duration,
          tags: track.tags,
          modelName: track.modelName,
          createdAt: track.createdAt,
          isPublic: track.isPublic,
        },
      });
    } catch (error) {
      console.error("[API] /api/music/tracks/:id error:", error);
      res.status(500).json({
        success: false,
        error: `获取作品详情失败: ${(error as Error).message}`,
      });
    }
  });

  // Admin: Add showcase music
  app.post("/api/admin/showcase-music", requireAdmin, async (req, res) => {
    try {
      const trackData = insertMusicTrackSchema.parse({
        ...req.body,
        isShowcase: true,
        isPublic: true,
        userId: req.session.userId,
      });

      const track = await storage.createMusicTrack(trackData);
      res.json(track);
    } catch (error) {
      console.error("Error creating showcase music:", error);
      res.status(500).json({ error: "Failed to create showcase music" });
    }
  });

  // Get user's orders
  app.get("/api/orders", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const orders = await storage.getUserOrders(req.session.userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Create new order (after successful payment)
  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const order = await storage.createOrder(orderData);
      
      // Send email notification to admin (non-blocking)
      sendOrderNotification({
        orderId: order.id,
        amount: Number(order.amount),
        musicStyle: order.musicStyle || undefined,
        mood: order.musicMoods?.join(', ') || undefined,
        lyrics: order.musicDescription || undefined,
        createdAt: order.createdAt,
      }).catch(err => console.error('[Email] Notification error:', err));
      
      // Trigger music generation task if payment is successful
      if (order.paymentStatus === "paid" && order.orderStatus === "processing") {
        try {
          const { musicGenerationQueue } = await import("./queue");
          
          await musicGenerationQueue.add(
            "generate-music",
            {
              orderId: order.id,
              userId: order.userId,
              musicDescription: order.musicDescription,
              musicStyle: order.musicStyle,
              musicMoods: order.musicMoods,
              musicKeywords: order.musicKeywords || [],
              musicDuration: order.musicDuration,
              songTitle: order.musicDescription.substring(0, 50), // 使用描述的前50个字符作为标题
              voiceType: "male", // 可以从订单数据中获取，这里先默认male
            },
            {
              priority: 1, // 高优先级
              attempts: 3, // 最多重试3次
              backoff: {
                type: "exponential",
                delay: 5000, // 初始延迟5秒
              },
            }
          );
          
          console.log(`[API] Music generation task queued for order ${order.id}`);
        } catch (error) {
          console.error(`[API] Failed to queue music generation task:`, error);
          // 不阻塞订单创建，记录错误即可
        }
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Admin: Get all orders
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Admin: Get single order details
  app.get("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Admin: Upload music file to order
  app.put("/api/admin/orders/:id/music", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { musicFileUrl } = req.body;

      if (!musicFileUrl) {
        return res.status(400).json({ error: "Music file URL is required" });
      }

      await storage.updateOrderMusicFile(id, musicFileUrl);
      res.json({ success: true });
    } catch (error) {
      console.error("Error uploading music:", error);
      res.status(500).json({ error: "Failed to upload music" });
    }
  });

  // Admin: Update order status
  app.put("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["pending", "processing", "completed", "failed", "cancelled", "closed"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.updateOrderStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Admin: Get order statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getOrderStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin: Get order statistics by date range
  app.get("/api/admin/stats/range", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const stats = await storage.getOrderStatsByDateRange(start, end);
      const orders = await storage.getOrdersByDateRange(start, end);
      
      res.json({ ...stats, orders });
    } catch (error) {
      console.error("Error fetching range stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Create review for an order
  app.post("/api/reviews", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { orderId, rating, comment } = req.body;

      // Verify order belongs to user
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.userId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to review this order" });
      }

      // Check if review already exists
      const existingReview = await storage.getOrderReview(orderId);
      if (existingReview) {
        return res.status(400).json({ error: "Review already exists for this order" });
      }

      const reviewData = {
        orderId,
        userId: req.session.userId,
        rating,
        comment: comment || null,
      };

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Get review for an order
  app.get("/api/orders/:id/review", async (req, res) => {
    try {
      const { id } = req.params;
      const review = await storage.getOrderReview(id);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });
  
  // Create payment intent for Stripe (with WeChat Pay, Alipay support)
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { amount, currency, paymentMethod } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const stripe = getStripe();
      
      // 根据支付方式设置payment_method_types
      let paymentMethodTypes: string[] = [];
      let paymentMethodOptions: any = {};
      
      if (paymentMethod === "wechat") {
        paymentMethodTypes = ["wechat_pay"];
        paymentMethodOptions = {
          wechat_pay: {
            client: "web",
          },
        };
      } else if (paymentMethod === "alipay") {
        paymentMethodTypes = ["alipay"];
      } else {
        // 默认支持信用卡、微信支付和支付宝
        paymentMethodTypes = ["card", "wechat_pay", "alipay"];
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount is already in cents from frontend
        currency: currency || "cny",
        payment_method_types: paymentMethodTypes,
        payment_method_configuration: process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION || "pmc_1SUNeS2Kpr72bl34tTfOqI2t",
        payment_method_options: Object.keys(paymentMethodOptions).length > 0 ? paymentMethodOptions : undefined,
        metadata: {
          userId: req.session.userId,
          paymentMethod: paymentMethod || "card",
        },
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Error creating payment intent: " + error.message });
    }
  });

  // Get payment intent status (for WeChat Pay and Alipay polling)
  app.get("/api/payment-intent/:paymentIntentId/status", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { paymentIntentId } = req.params;
      const stripe = getStripe();
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Verify the payment intent belongs to the user
      if (paymentIntent.metadata.userId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Get next action if available (for QR code display)
      let nextAction = null;
      if (paymentIntent.next_action) {
        nextAction = paymentIntent.next_action;
      }

      res.json({
        status: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method_types[0],
        nextAction: nextAction,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Error retrieving payment intent:", error);
      res.status(500).json({ error: "Error retrieving payment intent: " + error.message });
    }
  });

  // Object Storage endpoints for admin music file uploads
  
  // Serve uploaded music files (with ACL-based access control)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Check ACL permissions before serving the file
      const userId = req.session.userId;
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get presigned URL for music file upload (admin only)
  app.post("/api/objects/upload", requireAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL: " + error.message });
    }
  });

  // Get music generation status for an order
  app.get("/api/music/generation/:orderId/status", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { orderId } = req.params;
      
      // Verify order belongs to user
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.userId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Get generation task
      const task = await storage.getMusicGenerationTaskByOrderId(orderId);
      
      if (!task) {
        return res.json({
          orderId,
          status: order.orderStatus,
          progress: 0,
        });
      }

      res.json({
        orderId,
        status: task.status,
        progress: task.progress || 0,
        audioUrl: task.audioUrl || order.musicFileUrl,
        errorMessage: task.errorMessage,
      });
    } catch (error) {
      console.error("Error fetching generation status:", error);
      res.status(500).json({ error: "Failed to fetch generation status" });
    }
  });

  // Retry failed music generation (admin only)
  app.post("/api/music/generation/:orderId/retry", requireAdmin, async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.orderStatus !== "failed") {
        return res.status(400).json({ error: "Order is not in failed state" });
      }

      // Update order status to processing
      await storage.updateOrderStatus(orderId, "processing");

      // Queue new generation task
      const { musicGenerationQueue } = await import("./queue");
      
      await musicGenerationQueue.add(
        "generate-music",
        {
          orderId: order.id,
          userId: order.userId,
          musicDescription: order.musicDescription,
          musicStyle: order.musicStyle,
          musicMoods: order.musicMoods,
          musicKeywords: order.musicKeywords || [],
          musicDuration: order.musicDuration,
          songTitle: order.musicDescription.substring(0, 50),
        },
        {
          priority: 1,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        }
      );

      res.json({ success: true, message: "Retry task queued" });
    } catch (error) {
      console.error("Error retrying generation:", error);
      res.status(500).json({ error: "Failed to retry generation" });
    }
  });

  // Update order with uploaded music file (admin only)
  app.put("/api/music-files", requireAdmin, async (req, res) => {
    try {
      if (!req.body.musicFileURL || !req.body.orderId) {
        return res.status(400).json({ error: "musicFileURL and orderId are required" });
      }

      const { musicFileURL, orderId } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy for the uploaded file (public access)
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        musicFileURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      // Update order with the music file URL
      await storage.updateOrderMusicFile(orderId, objectPath);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error: any) {
      console.error("Error setting music file:", error);
      res.status(500).json({ error: "Internal server error: " + error.message });
    }
  });

  // ============ Stripe Webhook ============
  // 注意：这个路由需要 raw body，已在 index.ts 中通过 express.raw() 处理
  // POST /api/webhook/stripe
  app.post("/api/webhook/stripe", async (req, res) => {
    const sig = req.headers["stripe-signature"] as string | undefined;
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    let event: Stripe.Event;

    try {
      const stripeClient = getStripe();
      event = stripeClient.webhooks.constructEvent(
        req.body, // raw body (Buffer)
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("[Stripe Webhook] constructEvent error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}, id: ${event.id}`);

    // 处理 payment_intent.succeeded 事件
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata || {};
      const paymentIntentId = paymentIntent.id;

      console.log("[Stripe Webhook] payment_intent.succeeded:", paymentIntentId, metadata);

      try {
        // 通过 PaymentIntent ID 找到对应订单
        const order = await billingStore.getOrderByPaymentIntentId(paymentIntentId);
        
        if (!order) {
          console.warn("[Stripe Webhook] Order not found for paymentIntent:", paymentIntentId);
          // 返回 200 避免 Stripe 重试，但记录警告
          return res.json({ received: true, warning: "Order not found" });
        }

        // 幂等处理：如果订单已经是 paid 状态，直接返回
        if (order.status === "paid") {
          console.log("[Stripe Webhook] Order already paid, skipping:", order.id);
          return res.json({ received: true, info: "Already processed" });
        }

        // 获取用户
        const user = await userStore.getUserById(order.userId);
        if (!user) {
          console.error("[Stripe Webhook] User not found for order:", order.id);
          await billingStore.markOrderFailed(order.id);
          return res.json({ received: true, error: "User not found" });
        }

        // 根据订单类型更新用户状态
        const billingType = metadata.billingType as "pro" | "credits" | undefined;

        if (order.type === "pro" || order.type === "pro-subscription" || billingType === "pro") {
          // === Pro 会员升级 ===
          const now = new Date();
          let newExpiresAt: Date;

          // 如果已是 Pro 且未过期，则叠加 30 天
          if (user.plan === "pro" && user.planExpiresAt) {
            const currentExpires = new Date(user.planExpiresAt);
            if (currentExpires > now) {
              newExpiresAt = new Date(currentExpires);
              newExpiresAt.setDate(newExpiresAt.getDate() + 30);
            } else {
              newExpiresAt = new Date(now);
              newExpiresAt.setDate(newExpiresAt.getDate() + 30);
            }
          } else {
            newExpiresAt = new Date(now);
            newExpiresAt.setDate(newExpiresAt.getDate() + 30);
          }

          user.plan = "pro";
          user.planStartedAt = now.toISOString();
          user.planExpiresAt = newExpiresAt.toISOString();

          await userStore.updateUser(user);
          await billingStore.markOrderPaid(order.id);

          console.log(`[Stripe Webhook] User ${user.id} upgraded to Pro, expires: ${newExpiresAt.toISOString()}, order: ${order.id}`);

        } else if (order.type === "credits" || order.type === "credits-pack" || billingType === "credits") {
          // === Credits 购买 ===
          let creditsToAdd = 0;

          // 优先从 metadata 读取
          if (metadata.credits) {
            creditsToAdd = parseInt(metadata.credits as string, 10) || 0;
          }
          // 其次从订单记录读取
          else if (order.creditsChange) {
            creditsToAdd = order.creditsChange;
          }
          // 最后根据套餐 ID 推断
          else if (order.creditsPackId === "CREDITS_10" || order.creditsPackId === "pack-10") {
            creditsToAdd = 10;
          } else if (order.creditsPackId === "CREDITS_30" || order.creditsPackId === "pack-30") {
            creditsToAdd = 30;
          }

          if (creditsToAdd > 0) {
            user.extraCredits = (user.extraCredits || 0) + creditsToAdd;
            await userStore.updateUser(user);
            console.log(`[Stripe Webhook] User ${user.id} added ${creditsToAdd} credits, total: ${user.extraCredits}, order: ${order.id}`);
          }

          await billingStore.markOrderPaid(order.id);

        } else {
          console.warn("[Stripe Webhook] Unknown billingType/order.type:", billingType, order.type);
          // 仍然标记为 paid，避免重复处理
          await billingStore.markOrderPaid(order.id);
        }

        return res.json({ received: true, success: true });

      } catch (err) {
        console.error("[Stripe Webhook] Error handling payment_intent.succeeded:", err);
        // 返回 200 避免 Stripe 一直重试，错误记录在日志中
        return res.json({ received: true, error: "Internal error" });
      }
    }

    // 处理 payment_intent.payment_failed 事件
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentIntentId = paymentIntent.id;

      console.log("[Stripe Webhook] payment_intent.payment_failed:", paymentIntentId);

      try {
        const order = await billingStore.getOrderByPaymentIntentId(paymentIntentId);
        if (order && order.status === "pending") {
          await billingStore.markOrderFailed(order.id);
          console.log("[Stripe Webhook] Order marked as failed:", order.id);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error handling payment_intent.payment_failed:", err);
      }

      return res.json({ received: true });
    }

    // 处理 payment_intent.canceled 事件
    if (event.type === "payment_intent.canceled") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentIntentId = paymentIntent.id;

      console.log("[Stripe Webhook] payment_intent.canceled:", paymentIntentId);

      try {
        const order = await billingStore.getOrderByPaymentIntentId(paymentIntentId);
        if (order && order.status === "pending") {
          await billingStore.markOrderCanceled(order.id);
          console.log("[Stripe Webhook] Order marked as canceled:", order.id);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error handling payment_intent.canceled:", err);
      }

      return res.json({ received: true });
    }

    // 其他事件直接确认收到
    console.log("[Stripe Webhook] Unhandled event type:", event.type);
    return res.json({ received: true });
  });

  const httpServer = createServer(app);
  routesLog("[routes] registerRoutes end");

  return httpServer;
}

/**
 * 导出给 index.ts 使用的空函数（Webhook 路由已在 registerRoutes 中注册）
 * 保留此导出是为了兼容 index.ts 中的导入
 */
export function registerStripeWebhook(_app: Express): void {
  // Stripe Webhook 路由已在 registerRoutes 中注册
  // 此函数保留用于向后兼容
}

routesLog("[routes] module evaluation complete");
