import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Crown,
  Sparkles,
  Music,
  Download,
  Zap,
  Check,
  ArrowRight,
  CreditCard,
  Star,
  User,
  Loader2,
  Gift,
  AlertCircle,
  Settings,
  Lock,
} from "lucide-react";

// ============ 类型定义 ============

interface MembershipPlan {
  id: string;
  name: string;
  nameEn?: string;
  monthlyLimit: number;
  priceCny: number;
  priceUsd?: number;
  description: string;
  features: string[];
  highlight?: boolean;
  sortOrder?: number;
}

interface CreditPack {
  id: string;
  name: string;
  nameEn?: string;
  credits: number;
  priceCny: number;
  priceUsd?: number;
  description: string;
  bestValue?: boolean;
}

interface GuestConfig {
  dailyLimit: number;
  canDownload: boolean;
  description: string;
}

interface PlansResponse {
  success: boolean;
  plans: MembershipPlan[];
  creditPacks: CreditPack[];
  guestConfig: GuestConfig;
}

// ============ 组件 ============

export default function PricingPage() {
  const { user, isLoading: authLoading, quotaStats, refetchStats } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [buyingPro, setBuyingPro] = useState(false);
  const [buyingCredits, setBuyingCredits] = useState<string | null>(null);

  // 获取会员方案和套餐
  const { data: plansData, isLoading: plansLoading } = useQuery<PlansResponse>({
    queryKey: ["/api/billing/plans"],
    queryFn: async () => {
      const res = await fetch("/api/billing/plans");
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
  });

  // 购买 Pro 会员
  const buyProMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/billing/mock-buy-pro", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "购买失败");
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 升级成功！",
        description: `您已成为 Pro 会员，有效期至 ${new Date(data.user.planExpiresAt).toLocaleDateString("zh-CN")}`,
      });
      // 刷新用户数据
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refetchStats();
    },
    onError: (error: Error) => {
      toast({
        title: "购买失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 购买 Credits
  const buyCreditsMutation = useMutation({
    mutationFn: async (packId: string) => {
      const res = await fetch("/api/billing/mock-buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "购买失败");
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 购买成功！",
        description: `已增加 ${data.order.creditsChange} 首额外 Credits，当前剩余 ${data.user.extraCredits} 首`,
      });
      // 刷新用户数据
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refetchStats();
    },
    onError: (error: Error) => {
      toast({
        title: "购买失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBuyPro = async () => {
    setBuyingPro(true);
    try {
      await buyProMutation.mutateAsync();
    } finally {
      setBuyingPro(false);
    }
  };

  const handleBuyCredits = async (packId: string) => {
    setBuyingCredits(packId);
    try {
      await buyCreditsMutation.mutateAsync(packId);
    } finally {
      setBuyingCredits(null);
    }
  };

  const plans = plansData?.plans || [];
  const creditPacks = plansData?.creditPacks || [];
  const guestConfig = plansData?.guestConfig;

  const isLoggedIn = !!user;
  const isPro = user?.plan === "pro";
  const isFree = user?.plan === "free";

  // 格式化日期
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (authLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Crown className="w-5 h-5" />
            <span className="font-medium">会员与定价</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            选择适合你的方案
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            无论你是轻度体验还是重度创作，我们都有适合你的方案
          </p>
        </div>

        {/* 当前状态卡片 */}
        <Card className="mb-12 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              当前状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isLoggedIn ? (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">你当前是游客</p>
                  <p className="text-muted-foreground">
                    每天可免费生成 {guestConfig?.dailyLimit || 1} 首，无法下载。
                    <Link href="/auth" className="text-primary hover:underline ml-1">
                      登录后
                    </Link>
                    可使用每月 3 首的免费额度。
                  </p>
                </div>
              </div>
            ) : isFree ? (
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    你当前是
                    <Badge variant="secondary" className="ml-2">免费用户</Badge>
                  </p>
                  <p className="text-muted-foreground">
                    本月已生成 {quotaStats?.monthlyCount || 0} / {quotaStats?.monthlyLimit || 3} 首，可下载作品。
                    升级 Pro 后每月 30 首。
                  </p>
                </div>
              </div>
            ) : isPro ? (
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    你当前是
                    <Badge className="ml-2 bg-gradient-to-r from-amber-500 to-orange-500">Pro 会员</Badge>
                  </p>
                  <p className="text-muted-foreground">
                    有效期至 {formatDate((user as any)?.planExpiresAt)}，
                    本月已生成 {quotaStats?.monthlyCount || 0} / {quotaStats?.monthlyLimit || 30} 首，
                    额外 Credits 剩余 <span className="font-medium text-primary">{user?.extraCredits || 0}</span> 首。
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    你当前是
                    <Badge variant="outline" className="ml-2">{user?.plan}</Badge>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 会员方案卡片 */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* 游客卡片 */}
          <Card className="relative border-2 border-muted">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  游客
                </CardTitle>
              </div>
              <CardDescription>{guestConfig?.description || "游客每日仅可生成 1 首，无法下载。"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">免费</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  每日生成 {guestConfig?.dailyLimit || 1} 首
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Music className="w-4 h-4 text-green-500" />
                  基础试听功能
                </li>
                <li className="flex items-center gap-2 text-muted-foreground line-through">
                  <Download className="w-4 h-4 text-red-400" />
                  无法下载作品
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              {!isLoggedIn ? (
                <Link href="/auth" className="w-full">
                  <Button variant="outline" className="w-full">
                    注册 / 登录
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  当前非游客
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Free 方案卡片 */}
          {plans.find(p => p.id === "free") && (
            <Card className={`relative border-2 ${isFree ? "border-blue-500" : "border-muted"}`}>
              {isFree && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-500">当前方案</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    {plans.find(p => p.id === "free")?.name}
                  </CardTitle>
                </div>
                <CardDescription>{plans.find(p => p.id === "free")?.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">¥0</span>
                  <span className="text-muted-foreground">/月</span>
                </div>
                <ul className="space-y-3">
                  {plans.find(p => p.id === "free")?.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {!isLoggedIn ? (
                  <Link href="/auth" className="w-full">
                    <Button className="w-full">
                      注册免费使用
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : isFree ? (
                  <Button variant="outline" className="w-full" disabled>
                    ✓ 当前方案
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    基础方案
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Pro 方案卡片 */}
          {plans.find(p => p.id === "pro") && (
            <Card className={`relative border-2 ${isPro ? "border-amber-500" : "border-primary"} bg-gradient-to-b from-primary/5 to-transparent`}>
              {isPro ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">当前方案</Badge>
                </div>
              ) : (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-purple-500">推荐</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    {plans.find(p => p.id === "pro")?.name}
                  </CardTitle>
                </div>
                <CardDescription>{plans.find(p => p.id === "pro")?.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">¥{plans.find(p => p.id === "pro")?.priceCny}</span>
                  <span className="text-muted-foreground">/月</span>
                </div>
                <ul className="space-y-3">
                  {plans.find(p => p.id === "pro")?.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {!isLoggedIn ? (
                  <Link href="/auth" className="w-full">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                      登录后升级
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : isPro ? (
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    onClick={handleBuyPro}
                    disabled={buyingPro}
                  >
                    {buyingPro ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        续费 30 天
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600"
                    onClick={handleBuyPro}
                    disabled={buyingPro}
                  >
                    {buyingPro ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        升级为 Pro（模拟支付）
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Credits 套餐区域 */}
        {creditPacks.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">购买额外 Credits</h2>
              <p className="text-muted-foreground">
                当月额度用完后，可购买额外 Credits 继续创作
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {creditPacks.map((pack) => (
                <Card key={pack.id} className={`border-2 transition-colors ${
                  isPro ? "border-muted hover:border-primary/50" : "border-muted/50 opacity-80"
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-primary" />
                        {pack.name}
                      </CardTitle>
                      {pack.bestValue && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          推荐
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{pack.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">¥{pack.priceCny}</span>
                      <span className="text-muted-foreground">/ {pack.credits} 首</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    {!isLoggedIn ? (
                      <Link href="/auth" className="w-full">
                        <Button className="w-full" variant="outline">
                          登录后购买
                        </Button>
                      </Link>
                    ) : !isPro ? (
                      <>
                        <Button className="w-full" variant="outline" disabled>
                          <Lock className="w-4 h-4 mr-2" />
                          仅限 Pro 会员
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          升级为 Pro 后可购买 Credits
                        </p>
                      </>
                    ) : (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleBuyCredits(pack.id)}
                        disabled={buyingCredits === pack.id}
                      >
                        {buyingCredits === pack.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            处理中...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            购买（模拟支付）
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 开发工具区域（仅开发环境） */}
        {import.meta.env.DEV && isLoggedIn && (
          <DevTools user={user} refetchStats={refetchStats} />
        )}
      </div>
    </div>
  );
}

// ============ 开发工具组件 ============

interface DevToolsProps {
  user: any;
  refetchStats: () => void;
}

function DevTools({ user, refetchStats }: DevToolsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDevAction = async (action: string, endpoint: string, body?: any) => {
    setLoading(action);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "操作成功",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        refetchStats();
      } else {
        toast({
          title: "操作失败",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "请求失败",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-2 border-dashed border-amber-500/50 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <Settings className="w-5 h-5" />
          [DEV] 开发测试工具
        </CardTitle>
        <CardDescription>
          这些按钮仅在开发环境显示，用于快速测试会员和 Credits 功能
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500 text-amber-600 hover:bg-amber-500/10"
            onClick={() => handleDevAction("pro", "/api/billing/dev/set-pro-with-credits", { credits: 30 })}
            disabled={loading === "pro"}
          >
            {loading === "pro" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crown className="w-4 h-4 mr-2" />}
            设为 Pro + 30 Credits
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-amber-500 text-amber-600 hover:bg-amber-500/10"
            onClick={() => handleDevAction("clear", "/api/billing/dev/clear-credits")}
            disabled={loading === "clear"}
          >
            {loading === "clear" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
            清空 Credits
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-amber-500 text-amber-600 hover:bg-amber-500/10"
            onClick={() => handleDevAction("free", "/api/billing/dev/reset-to-free")}
            disabled={loading === "free"}
          >
            {loading === "free" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
            重置为 Free
          </Button>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            当前用户: <span className="font-medium">{user?.displayName}</span> |
            计划: <Badge variant="outline" className="ml-1">{user?.plan}</Badge> |
            额外 Credits: <span className="font-medium">{user?.extraCredits || 0}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

