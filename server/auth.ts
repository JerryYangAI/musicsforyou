/**
 * JWT 认证模块
 *
 * 提供 JWT token 签发、验证和 Express 中间件
 */

import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import userStore, { type User, type UserPlan } from "./userStore";

// ============ 类型定义 ============

/**
 * JWT Payload
 */
export interface AuthTokenPayload {
  userId: string;
  plan: UserPlan;
}

/**
 * 扩展 Express Request 类型
 */
declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        plan: UserPlan;
      } | null;
      guestId?: string;
    }
  }
}

// ============ 配置 ============

const JWT_SECRET = process.env.JWT_SECRET || "musicsforyou-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token 有效期 7 天
const COOKIE_NAME = "auth_token";
const GUEST_COOKIE_NAME = "guest_id";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ============ JWT 函数 ============

/**
 * 签发认证 Token
 */
export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * 验证认证 Token
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// ============ Cookie 函数 ============

/**
 * 设置认证 Cookie
 */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    path: "/",
  });
}

/**
 * 清除认证 Cookie
 */
export function clearAuthCookie(res: Response): void {
  res.cookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * 获取或创建 Guest ID Cookie
 */
export function ensureGuestIdCookie(req: Request, res: Response): string {
  let guestId = req.cookies?.[GUEST_COOKIE_NAME];

  if (!guestId) {
    guestId = `guest_${randomUUID()}`;
    res.cookie(GUEST_COOKIE_NAME, guestId, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 天
      path: "/",
    });
    console.log(`[Auth] 创建新游客 ID: ${guestId}`);
  }

  return guestId;
}

// ============ 中间件 ============

/**
 * 附加用户信息中间件
 * 
 * 从 Cookie 读取 auth_token，验证后附加到 req.authUser
 * 不合法或不存在时，req.authUser = null
 */
export function attachUserIfExists(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    req.authUser = null;
    return next();
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    req.authUser = null;
    // 清除无效 token
    clearAuthCookie(res);
    return next();
  }

  req.authUser = {
    id: payload.userId,
    plan: payload.plan,
  };

  next();
}

/**
 * 要求登录中间件
 * 
 * 如果用户未登录，返回 401 错误
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.authUser) {
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      error: "请先登录",
    });
    return;
  }

  next();
}

/**
 * 要求管理员权限中间件
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.authUser) {
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      error: "请先登录",
    });
    return;
  }

  if (req.authUser.plan !== "admin") {
    res.status(403).json({
      success: false,
      code: "FORBIDDEN",
      error: "需要管理员权限",
    });
    return;
  }

  next();
}

// ============ 辅助函数 ============

/**
 * 为用户签发 token 并设置 Cookie
 */
export function loginUser(res: Response, user: User): string {
  const token = signAuthToken({
    userId: user.id,
    plan: user.plan,
  });

  setAuthCookie(res, token);
  return token;
}

/**
 * 发送密码重置通知（占位函数，后续接入真实服务）
 */
export function sendResetCodeToUser(user: User, resetToken: string): void {
  // 暂时只打印到控制台，将来接入阿里云短信/邮件服务
  const contact = user.email || user.phone;
  console.log("=".repeat(60));
  console.log("[PASSWORD_RESET_TOKEN]");
  console.log(`用户: ${contact}`);
  console.log(`重置令牌: ${resetToken}`);
  console.log(`有效期: 30 分钟`);
  console.log("=".repeat(60));

  // TODO: 将来实现：
  // if (user.email) {
  //   await sendEmail(user.email, "密码重置", `您的重置令牌是: ${resetToken}`);
  // } else if (user.phone) {
  //   await sendSMS(user.phone, `您的重置验证码是: ${resetToken.substring(0, 6)}`);
  // }
}

// ============ 导出 ============

export default {
  signAuthToken,
  verifyAuthToken,
  setAuthCookie,
  clearAuthCookie,
  ensureGuestIdCookie,
  attachUserIfExists,
  requireAuth,
  requireAdmin,
  loginUser,
  sendResetCodeToUser,
};

