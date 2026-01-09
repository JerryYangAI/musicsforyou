/**
 * 认证相关路由
 *
 * 包含注册、登录、找回密码等接口
 * 支持手机号和邮箱两种注册方式
 */

import { Router } from "express";
import { z } from "zod";
import userStore, { type User, getUserPublicInfo } from "./userStore";
import auth, { attachUserIfExists, loginUser, sendResetCodeToUser, clearAuthCookie } from "./auth";

const router = Router();

// ============ 参数校验 Schema ============

// 手机号预处理：去除非数字，去掉前导 86/086，便于兼容 +86、空格/破折号
const normalizePhone = (value: unknown) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/[^\d]/g, "");
  const cleaned = digits.replace(/^0?86/, "");
  return cleaned;
};

// 中国手机号正则（11 位，以 1 开头 3-9 段）
const PHONE_SCHEMA = z.preprocess(
  normalizePhone,
  z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的中国手机号")
);

// 注册 Schema
const registerSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("phone"),
    phone: PHONE_SCHEMA,
    password: z.string().min(6, "密码至少 6 位"),
    displayName: z.string().min(1, "请输入昵称").max(50, "昵称最多 50 个字符"),
  }),
  z.object({
    method: z.literal("email"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(6, "密码至少 6 位"),
    displayName: z.string().min(1, "请输入昵称").max(50, "昵称最多 50 个字符"),
  }),
]);

// 登录 Schema
const loginSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("phone"),
    phone: PHONE_SCHEMA,
    password: z.string().min(1, "请输入密码"),
  }),
  z.object({
    method: z.literal("email"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(1, "请输入密码"),
  }),
]);

// 请求重置密码 Schema
const requestResetSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("phone"),
    phone: PHONE_SCHEMA,
  }),
  z.object({
    method: z.literal("email"),
    email: z.string().email("请输入有效的邮箱地址"),
  }),
]);

// 重置密码 Schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, "请输入重置令牌"),
  newPassword: z.string().min(6, "新密码至少 6 位"),
});

// ============ 路由 ============

/**
 * POST /api/auth/register
 * 用户注册（支持手机号或邮箱）
 */
router.post("/register", async (req, res) => {
  try {
    // 参数校验
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: errorMsg,
      });
    }

    const data = parseResult.data;

    // 检查重复
    if (data.method === "phone") {
      const existingUser = await userStore.getUserByPhone(data.phone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          code: "PHONE_EXISTS",
          error: "该手机号已被注册",
        });
      }
    } else {
      const existingUser = await userStore.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          code: "EMAIL_EXISTS",
          error: "该邮箱已被注册",
        });
      }
    }

    // 创建用户
    const user = await userStore.createUser({
      phone: data.method === "phone" ? data.phone : undefined,
      phoneRegion: data.method === "phone" ? "CN" : undefined,
      email: data.method === "email" ? data.email : undefined,
      passwordPlain: data.password,
      displayName: data.displayName,
      plan: "free",
    });

    // 签发 token 并设置 Cookie
    loginUser(res, user);

    console.log(`[Auth] 新用户注册: ${user.id}, ${user.email || user.phone}`);

    res.json({
      success: true,
      user: getUserPublicInfo(user),
    });
  } catch (error) {
    console.error("[Auth] 注册失败:", error);
    res.status(500).json({
      success: false,
      code: "REGISTER_ERROR",
      error: "注册失败，请稍后重试",
    });
  }
});

/**
 * POST /api/auth/login
 * 用户登录（支持手机号或邮箱）
 */
router.post("/login", async (req, res) => {
  try {
    // 参数校验
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: errorMsg,
      });
    }

    const data = parseResult.data;

    // 查找用户
    let user: User | undefined;
    if (data.method === "phone") {
      user = await userStore.getUserByPhone(data.phone);
    } else {
      user = await userStore.getUserByEmail(data.email);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "账号或密码错误",
      });
    }

    // 验证密码
    const isValid = await userStore.verifyPassword(user, data.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "账号或密码错误",
      });
    }

    // 签发 token 并设置 Cookie
    loginUser(res, user);

    console.log(`[Auth] 用户登录: ${user.id}, ${user.email || user.phone}`);

    res.json({
      success: true,
      user: getUserPublicInfo(user),
    });
  } catch (error) {
    console.error("[Auth] 登录失败:", error);
    res.status(500).json({
      success: false,
      code: "LOGIN_ERROR",
      error: "登录失败，请稍后重试",
    });
  }
});

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
router.get("/me", attachUserIfExists, async (req, res) => {
  try {
    if (!req.authUser) {
      return res.json({
        success: true,
        user: null,
      });
    }

    const user = await userStore.getUserById(req.authUser.id);
    if (!user) {
      clearAuthCookie(res);
      return res.json({
        success: true,
        user: null,
      });
    }

    res.json({
      success: true,
      user: getUserPublicInfo(user),
    });
  } catch (error) {
    console.error("[Auth] 获取用户信息失败:", error);
    res.status(500).json({
      success: false,
      code: "GET_USER_ERROR",
      error: "获取用户信息失败",
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  console.log("[Auth] 用户登出");
  res.json({
    success: true,
  });
});

/**
 * POST /api/auth/request-password-reset
 * 请求重置密码
 */
router.post("/request-password-reset", async (req, res) => {
  try {
    // 参数校验
    const parseResult = requestResetSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: errorMsg,
      });
    }

    const data = parseResult.data;

    // 查找用户
    let user: User | undefined;
    if (data.method === "phone") {
      user = await userStore.getUserByPhone(data.phone);
    } else {
      user = await userStore.getUserByEmail(data.email);
    }

    // 无论是否找到用户，都返回相同的响应（安全考虑）
    const response = {
      success: true,
      message: "If the account exists, we have sent a reset code.",
    };

    if (user) {
      // 生成重置令牌
      const resetToken = await userStore.generateResetToken(user.id);

      // 发送重置通知（当前只是打印到控制台）
      sendResetCodeToUser(user, resetToken);

      console.log(`[Auth] 请求重置密码: ${user.id}, ${user.email || user.phone}`);
    }

    res.json(response);
  } catch (error) {
    console.error("[Auth] 请求重置密码失败:", error);
    res.status(500).json({
      success: false,
      code: "RESET_REQUEST_ERROR",
      error: "请求重置密码失败，请稍后重试",
    });
  }
});

/**
 * POST /api/auth/reset-password
 * 重置密码
 */
router.post("/reset-password", async (req, res) => {
  try {
    // 参数校验
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: errorMsg,
      });
    }

    const { token, newPassword } = parseResult.data;

    // 验证重置令牌
    const user = await userStore.verifyResetToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        code: "INVALID_TOKEN",
        error: "重置令牌无效或已过期",
      });
    }

    // 更新密码
    await userStore.updatePassword(user.id, newPassword);

    // 自动登录
    loginUser(res, user);

    console.log(`[Auth] 密码重置成功: ${user.id}`);

    res.json({
      success: true,
      user: getUserPublicInfo(user),
    });
  } catch (error) {
    console.error("[Auth] 重置密码失败:", error);
    res.status(500).json({
      success: false,
      code: "RESET_PASSWORD_ERROR",
      error: "重置密码失败，请稍后重试",
    });
  }
});

export default router;

