/**
 * 用户数据存储模块
 *
 * 使用本地 JSON 文件实现用户数据持久化存储
 * 支持手机号/邮箱注册、会员计划、额度管理
 */

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "crypto";

// ============ 类型定义 ============

/**
 * 用户计划类型
 */
export type UserPlan = "free" | "pro" | "vip" | "admin";

/**
 * 手机号区域
 */
export type PhoneRegion = "CN" | "INTL" | null;

/**
 * User 数据模型
 */
export interface User {
  id: string;
  // 身份信息（至少有一个）
  email?: string;
  phone?: string;
  phoneRegion?: PhoneRegion;
  // 安全
  passwordHash: string;
  // 展示信息
  displayName: string;
  // 会员与额度
  plan: UserPlan;
  extraCredits: number;           // 额外付费 credits 剩余数量
  planStartedAt?: string | null;
  planExpiresAt?: string | null;
  // 找回密码
  resetToken?: string | null;
  resetTokenExpiresAt?: string | null;
  // 时间戳
  createdAt: string;
  updatedAt?: string;
}

/**
 * 创建用户的输入参数
 */
export interface CreateUserInput {
  email?: string;
  phone?: string;
  phoneRegion?: PhoneRegion;
  passwordPlain: string;
  displayName: string;
  plan?: UserPlan;
}

/**
 * 用户存储文件结构
 */
interface UserStoreData {
  users: User[];
  lastUpdated: string;
}

// ============ 配置 ============

const DATA_DIR = path.resolve(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const BCRYPT_ROUNDS = 10;

// ============ 内存缓存 ============

let usersCache: User[] | null = null;
let isWriting = false;
const writeQueue: Array<() => Promise<void>> = [];

// ============ 工具函数 ============

/**
 * 确保数据目录存在
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`[UserStore] 创建数据目录: ${DATA_DIR}`);
  }
}

/**
 * 从文件读取数据
 */
function readFromFile(): UserStoreData {
  ensureDataDir();

  if (!fs.existsSync(USERS_FILE)) {
    return {
      users: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const content = fs.readFileSync(USERS_FILE, "utf-8");
    const data = JSON.parse(content) as UserStoreData;
    return data;
  } catch (error) {
    console.error("[UserStore] 读取文件失败:", error);
    return {
      users: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * 写入数据到文件
 */
async function writeToFile(data: UserStoreData): Promise<void> {
  ensureDataDir();
  const content = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(USERS_FILE, content, "utf-8");
}

/**
 * 处理写入队列
 */
async function processWriteQueue(): Promise<void> {
  if (isWriting || writeQueue.length === 0) {
    return;
  }

  isWriting = true;

  while (writeQueue.length > 0) {
    const writeTask = writeQueue.shift();
    if (writeTask) {
      try {
        await writeTask();
      } catch (error) {
        console.error("[UserStore] 写入任务失败:", error);
      }
    }
  }

  isWriting = false;
}

/**
 * 添加写入任务到队列
 */
function enqueueWrite(task: () => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    writeQueue.push(async () => {
      try {
        await task();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    processWriteQueue();
  });
}

/**
 * 加载缓存
 */
function loadCache(): User[] {
  if (usersCache === null) {
    const data = readFromFile();
    usersCache = data.users;
    console.log(`[UserStore] 加载了 ${usersCache.length} 个用户`);
  }
  return usersCache;
}

/**
 * 刷新缓存到文件
 */
async function flushCache(): Promise<void> {
  if (usersCache === null) {
    return;
  }

  await enqueueWrite(async () => {
    const data: UserStoreData = {
      users: usersCache!,
      lastUpdated: new Date().toISOString(),
    };
    await writeToFile(data);
  });
}

// ============ 公共 API ============

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const users = loadCache();
  return users.find((user) => user.id === id);
}

/**
 * 根据邮箱获取用户
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = loadCache();
  const normalizedEmail = email.toLowerCase().trim();
  return users.find((user) => user.email?.toLowerCase() === normalizedEmail);
}

/**
 * 根据手机号获取用户
 */
export async function getUserByPhone(phone: string): Promise<User | undefined> {
  const users = loadCache();
  const normalizedPhone = phone.replace(/\s+/g, "").trim();
  return users.find((user) => user.phone === normalizedPhone);
}

/**
 * 根据重置令牌获取用户
 */
export async function getUserByResetToken(token: string): Promise<User | undefined> {
  const users = loadCache();
  return users.find((user) => user.resetToken === token);
}

/**
 * 创建新用户
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const users = loadCache();

  // 生成密码哈希
  const passwordHash = await bcrypt.hash(input.passwordPlain, BCRYPT_ROUNDS);

  // 创建用户对象
  const user: User = {
    id: randomUUID(),
    email: input.email?.toLowerCase().trim(),
    phone: input.phone?.replace(/\s+/g, "").trim(),
    phoneRegion: input.phoneRegion ?? null,
    passwordHash,
    displayName: input.displayName.trim(),
    plan: input.plan ?? "free",
    extraCredits: 0,
    planStartedAt: null,
    planExpiresAt: null,
    resetToken: null,
    resetTokenExpiresAt: null,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  usersCache = users;
  await flushCache();

  console.log(`[UserStore] 创建新用户: ${user.id}, ${user.email || user.phone}`);
  return user;
}

/**
 * 更新用户
 */
export async function updateUser(user: User): Promise<void> {
  const users = loadCache();
  const index = users.findIndex((u) => u.id === user.id);

  if (index === -1) {
    throw new Error(`用户不存在: ${user.id}`);
  }

  user.updatedAt = new Date().toISOString();
  users[index] = user;
  usersCache = users;
  await flushCache();

  console.log(`[UserStore] 更新用户: ${user.id}`);
}

/**
 * 验证用户密码
 */
export async function verifyPassword(user: User, passwordPlain: string): Promise<boolean> {
  return bcrypt.compare(passwordPlain, user.passwordHash);
}

/**
 * 更新用户密码
 */
export async function updatePassword(userId: string, newPasswordPlain: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error(`用户不存在: ${userId}`);
  }

  user.passwordHash = await bcrypt.hash(newPasswordPlain, BCRYPT_ROUNDS);
  user.resetToken = null;
  user.resetTokenExpiresAt = null;
  await updateUser(user);

  console.log(`[UserStore] 更新用户密码: ${userId}`);
}

/**
 * 生成密码重置令牌
 */
export async function generateResetToken(userId: string): Promise<string> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error(`用户不存在: ${userId}`);
  }

  // 生成随机令牌（32 字节 = 64 字符十六进制）
  const resetToken = randomBytes(32).toString("hex");
  
  // 设置过期时间（30 分钟）
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  user.resetToken = resetToken;
  user.resetTokenExpiresAt = expiresAt.toISOString();
  await updateUser(user);

  return resetToken;
}

/**
 * 验证重置令牌
 */
export async function verifyResetToken(token: string): Promise<User | null> {
  const user = await getUserByResetToken(token);
  
  if (!user || !user.resetTokenExpiresAt) {
    return null;
  }

  const expiresAt = new Date(user.resetTokenExpiresAt);
  if (expiresAt < new Date()) {
    return null; // 令牌已过期
  }

  return user;
}

/**
 * 减少用户额外积分
 */
export async function decrementExtraCredit(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) {
    return false;
  }

  if (user.extraCredits <= 0) {
    return false;
  }

  user.extraCredits = Math.max(0, user.extraCredits - 1);
  await updateUser(user);

  console.log(`[UserStore] 扣减用户积分: ${userId}, 剩余: ${user.extraCredits}`);
  return true;
}

/**
 * 增加用户额外积分
 */
export async function addExtraCredits(userId: string, amount: number): Promise<void> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error(`用户不存在: ${userId}`);
  }

  user.extraCredits += amount;
  await updateUser(user);

  console.log(`[UserStore] 增加用户积分: ${userId}, 新增: ${amount}, 总计: ${user.extraCredits}`);
}

/**
 * 更新用户计划
 */
export async function updateUserPlan(
  userId: string,
  plan: UserPlan,
  expiresAt?: Date
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error(`用户不存在: ${userId}`);
  }

  user.plan = plan;
  user.planStartedAt = new Date().toISOString();
  user.planExpiresAt = expiresAt?.toISOString() ?? null;
  await updateUser(user);

  console.log(`[UserStore] 更新用户计划: ${userId}, plan: ${plan}`);
}

/**
 * 获取用户总数
 */
export async function getUserCount(): Promise<number> {
  const users = loadCache();
  return users.length;
}

/**
 * 获取用户公开信息（不含敏感数据）
 */
export function getUserPublicInfo(user: User) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    displayName: user.displayName,
    plan: user.plan,
    extraCredits: user.extraCredits,
    createdAt: user.createdAt,
  };
}

// ============ 导出 ============

export default {
  getUserById,
  getUserByEmail,
  getUserByPhone,
  getUserByResetToken,
  createUser,
  updateUser,
  verifyPassword,
  updatePassword,
  generateResetToken,
  verifyResetToken,
  decrementExtraCredit,
  addExtraCredits,
  updateUserPlan,
  getUserCount,
  getUserPublicInfo,
};

