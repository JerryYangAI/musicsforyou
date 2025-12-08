import { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ============ 类型定义 ============

export type UserPlan = "guest" | "free" | "pro" | "vip" | "admin";

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  displayName: string;
  plan: UserPlan;
  extraCredits: number;
  // Legacy fields for backward compatibility
  username?: string;
  isAdmin?: boolean;
}

export interface QuotaStats {
  todayCount: number;
  monthlyCount: number;
  totalCount: number;
  plan: UserPlan;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  extraCredits: number;
  remaining: number;
  canDownload: boolean;
}

interface RegisterParams {
  method: "phone" | "email";
  phone?: string;
  email?: string;
  password: string;
  displayName: string;
}

interface LoginParams {
  method: "phone" | "email";
  phone?: string;
  email?: string;
  password: string;
}

interface AuthContextType {
  // 用户状态
  user: AuthUser | null | undefined;
  isLoading: boolean;
  isLoggedIn: boolean;
  // 额度统计
  quotaStats: QuotaStats | null;
  isLoadingStats: boolean;
  refetchStats: () => void;
  // 认证操作
  login: (params: LoginParams) => Promise<AuthUser>;
  register: (params: RegisterParams) => Promise<AuthUser>;
  logout: () => Promise<void>;
  // 权限检查
  canDownload: boolean;
  getPlanLabel: () => string;
}

// ============ Context ============

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============ Provider ============

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // 获取当前用户（同时支持新旧 API）
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        // 首先尝试新的 auth-v2 API
        const v2Res = await fetch("/api/auth-v2/me", { credentials: "include" });
        if (v2Res.ok) {
          const v2Data = await v2Res.json();
          if (v2Data.success && v2Data.user) {
            return {
              ...v2Data.user,
              // 映射 plan 到 isAdmin 用于向后兼容
              isAdmin: v2Data.user.plan === "admin",
            };
          }
        }

        // 降级到旧的 session API
        const legacyRes = await fetch("/api/auth/me", { credentials: "include" });
        if (legacyRes.status === 401) {
          return null;
        }
        if (!legacyRes.ok) {
          throw new Error("Failed to fetch user");
        }
        const legacyData = await legacyRes.json();
        // 将旧格式转换为新格式
        return {
          id: legacyData.id,
          displayName: legacyData.username,
          username: legacyData.username,
          plan: legacyData.isAdmin ? "admin" : "free",
          extraCredits: 0,
          isAdmin: legacyData.isAdmin,
        } as AuthUser;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 30 * 1000, // 30 秒
  });

  // 获取额度统计
  const { data: quotaStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery<QuotaStats | null>({
    queryKey: ["/api/music/stats"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/music/stats", { credentials: "include" });
        if (!res.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await res.json();
        if (data.success) {
          return {
            todayCount: data.todayCount,
            monthlyCount: data.monthlyCount,
            totalCount: data.totalCount,
            plan: data.plan,
            dailyLimit: data.dailyLimit,
            monthlyLimit: data.monthlyLimit,
            extraCredits: data.extraCredits,
            remaining: data.remaining,
            canDownload: data.canDownload,
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 60 * 1000, // 1 分钟
  });

  // 登录
  const loginMutation = useMutation({
    mutationFn: async (params: LoginParams): Promise<AuthUser> => {
      const res = await fetch("/api/auth-v2/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "登录失败");
      }
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/music/stats"] });
    },
  });

  // 注册
  const registerMutation = useMutation({
    mutationFn: async (params: RegisterParams): Promise<AuthUser> => {
      const res = await fetch("/api/auth-v2/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "注册失败");
      }
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/music/stats"] });
    },
  });

  // 登出
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // 同时调用新旧 API 确保都登出
      await Promise.all([
        fetch("/api/auth-v2/logout", { method: "POST", credentials: "include" }),
        fetch("/api/auth/logout", { method: "POST", credentials: "include" }),
      ]);
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/music/stats"] });
    },
  });

  // 公开方法
  const login = useCallback(async (params: LoginParams): Promise<AuthUser> => {
    return loginMutation.mutateAsync(params);
  }, [loginMutation]);

  const register = useCallback(async (params: RegisterParams): Promise<AuthUser> => {
    return registerMutation.mutateAsync(params);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  // 判断是否可以下载（非游客）
  const canDownload = !!user && (quotaStats?.canDownload ?? false);

  // 获取用户计划的显示标签
  const getPlanLabel = useCallback((): string => {
    if (!user) return "游客";
    switch (user.plan) {
      case "free": return "免费用户";
      case "pro": return "会员";
      case "vip": return "VIP";
      case "admin": return "管理员";
      default: return "游客";
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    quotaStats,
    isLoadingStats,
    refetchStats,
    login,
    register,
    logout,
    canDownload,
    getPlanLabel,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============ Hook ============

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
