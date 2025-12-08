import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "./LanguageProvider";
import { useAuth } from "./AuthProvider";
import { User, LogOut, Shield, Music, FolderHeart, ChevronDown, Sparkles, Crown } from "lucide-react";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/Logo_1762426221156.png";

export function Header() {
  const { t } = useLanguage();
  const { user, logout, quotaStats, getPlanLabel, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();

  const handleLoginClick = () => {
    setLocation("/auth");
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleProfileClick = () => {
    setLocation("/profile");
  };

  // 获取计划对应的 Badge 样式
  const getPlanBadgeVariant = () => {
    if (!user) return "secondary";
    switch (user.plan) {
      case "pro": return "default";
      case "vip": return "default";
      case "admin": return "destructive";
      default: return "secondary";
    }
  };

  // 格式化额度显示
  const getQuotaDisplay = () => {
    if (!quotaStats) return null;
    
    if (quotaStats.plan === "guest") {
      return `今日: ${quotaStats.todayCount}/${quotaStats.dailyLimit || 1}`;
    } else if (quotaStats.plan === "free") {
      return `本月: ${quotaStats.monthlyCount}/${quotaStats.monthlyLimit || 3}`;
    } else if (quotaStats.plan === "pro") {
      const base = `本月: ${quotaStats.monthlyCount}/${quotaStats.monthlyLimit || 30}`;
      if (quotaStats.extraCredits > 0) {
        return `${base} + ${quotaStats.extraCredits} Credits`;
      }
      return base;
    }
    return `已生成: ${quotaStats.totalCount}`;
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-3 hover-elevate px-3 py-2 rounded-lg transition-all group" 
          data-testid="link-home"
        >
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <img src={logoImage} alt={t.header.brandName} className="h-8 w-auto" />
          </div>
          <span className="font-bold text-xl gradient-text">{t.header.brandName}</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link 
            href="/suno-demo" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all relative group flex items-center gap-1.5" 
            data-testid="link-suno-demo"
          >
            <Sparkles className="h-4 w-4" />
            生成音乐
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </Link>
          <Link 
            href="/my-works" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all relative group flex items-center gap-1.5" 
            data-testid="link-my-works"
          >
            <FolderHeart className="h-4 w-4" />
            我的作品
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </Link>
          <Link 
            href="/create" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all relative group" 
            data-testid="link-create"
          >
            {t.header.create}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </Link>
          <Link 
            href="/orders" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all relative group" 
            data-testid="link-orders"
          >
            {t.header.orders}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </Link>
          <Link 
            href="/pricing" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all relative group flex items-center gap-1.5" 
            data-testid="link-pricing"
          >
            <Crown className="h-4 w-4" />
            会员
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </Link>
          {user?.isAdmin && (
            <Link 
              href="/admin" 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all flex items-center gap-1.5 relative group" 
              data-testid="link-admin"
            >
              <Shield className="h-4 w-4" />
              {t.header.admin}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          
          {user ? (
            <>
              {/* 用户下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2 hover:bg-primary/10 transition-colors"
                    data-testid="button-user-menu"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline max-w-24 truncate">
                      {user.displayName || user.username}
                    </span>
                    <Badge variant={getPlanBadgeVariant()} className="text-xs">
                      {getPlanLabel()}
                    </Badge>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{user.displayName || user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email || user.phone || ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* 额度信息 */}
                  {quotaStats && (
                    <>
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>额度使用</span>
                          <span>{getQuotaDisplay()}</span>
                        </div>
                        {quotaStats.plan === "pro" && quotaStats.extraCredits > 0 && (
                          <div className="flex justify-between mt-1">
                            <span>额外积分</span>
                            <span>{quotaStats.extraCredits}</span>
                          </div>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={() => setLocation("/suno-demo")} className="cursor-pointer">
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成音乐
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/my-works")} className="cursor-pointer">
                    <FolderHeart className="w-4 h-4 mr-2" />
                    我的作品
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/pricing")} className="cursor-pointer">
                    <Crown className="w-4 h-4 mr-2" />
                    会员与定价
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    个人资料
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.header.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* 游客提示 */}
              {quotaStats && (
                <span className="hidden lg:inline text-xs text-muted-foreground mr-2">
                  游客: {quotaStats.todayCount}/{quotaStats.dailyLimit || 1} 首/天
                </span>
              )}
              <Button 
                onClick={handleLoginClick} 
                className="gradient-primary text-white hover:shadow-lg transition-all"
                data-testid="button-login"
              >
                {t.header.login}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* 游客提示条 */}
      {!isLoggedIn && (
        <div className="bg-muted/50 border-t py-1.5 px-4 text-center">
          <p className="text-xs text-muted-foreground">
            当前以游客身份使用，每日仅可生成 1 首且无法下载。
            <Link href="/auth" className="text-primary hover:underline ml-1">
              注册后每月可生成 3 首并支持下载
            </Link>
          </p>
        </div>
      )}
    </header>
  );
}
