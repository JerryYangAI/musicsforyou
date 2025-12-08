/**
 * 会员计划与 Credits 套餐配置
 * 
 * 所有会员等级和定价相关的配置都在这里集中管理，
 * 方便后续调整价格、额度等参数。
 */

export interface MembershipPlan {
  id: "free" | "pro";
  name: string;
  nameEn: string;
  monthlyLimit: number;
  priceCny: number;
  priceUsd?: number;
  description: string;
  features: string[];
  highlight?: boolean;
  sortOrder: number;
}

export interface CreditPack {
  id: string;
  name: string;
  nameEn: string;
  credits: number;
  priceCny: number;
  priceUsd?: number;
  description: string;
  bestValue?: boolean;
}

/**
 * 会员计划配置
 */
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "free",
    name: "免费版",
    nameEn: "Free",
    monthlyLimit: 3,
    priceCny: 0,
    priceUsd: 0,
    description: "适合体验和轻量使用",
    features: [
      "每月 3 首 AI 音乐生成",
      "可试听和下载自己的作品",
      "基础功能体验"
    ],
    sortOrder: 1
  },
  {
    id: "pro",
    name: "Pro 会员",
    nameEn: "Pro",
    monthlyLimit: 30,
    priceCny: 19.9,
    priceUsd: 2.99,
    description: "适合创作者和重度使用者",
    features: [
      "每月 30 首 AI 音乐生成",
      "支持下载高质量音频和封面",
      "可购买额外 Credits 扩容",
      "优先体验新功能"
    ],
    highlight: true,
    sortOrder: 2
  }
];

/**
 * Credits 套餐配置
 */
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack-10",
    name: "10 首扩展包",
    nameEn: "10-song Credit Pack",
    credits: 10,
    priceCny: 9.9,
    priceUsd: 1.49,
    description: "额外获得 10 次生成配额，用于 Pro 超额后的扩展使用",
    bestValue: true
  },
  {
    id: "pack-30",
    name: "30 首扩展包",
    nameEn: "30-song Credit Pack",
    credits: 30,
    priceCny: 24.9,
    priceUsd: 3.99,
    description: "大额度包，更划算"
  }
];

/**
 * 游客配置
 */
export const GUEST_CONFIG = {
  dailyLimit: 1,
  canDownload: false,
  description: "游客每日仅可生成 1 首，无法下载。"
};

/**
 * 根据 planId 获取会员计划配置
 */
export function getPlanById(planId: string): MembershipPlan | undefined {
  return MEMBERSHIP_PLANS.find(plan => plan.id === planId);
}

/**
 * 根据 packId 获取 Credits 套餐配置
 */
export function getCreditPackById(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find(pack => pack.id === packId);
}

/**
 * 获取会员月度限额
 */
export function getMonthlyLimit(planId: string): number {
  const plan = getPlanById(planId);
  return plan?.monthlyLimit ?? MEMBERSHIP_PLANS[0].monthlyLimit;
}

