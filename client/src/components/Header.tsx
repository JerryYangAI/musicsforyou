import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Music, User, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

interface HeaderProps {
  isAuthenticated?: boolean;
}

export function Header({ isAuthenticated = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center gap-2 hover-elevate px-3 py-2 rounded-md transition-all" data-testid="link-home">
            <div className="p-1.5 bg-gradient-to-br from-primary to-chart-2 rounded-lg">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AI音乐工坊</span>
          </a>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/create">
            <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-create">
              创作音乐
            </a>
          </Link>
          <Link href="/orders">
            <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-orders">
              我的订单
            </a>
          </Link>
          <Link href="/pricing">
            <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">
              定价
            </a>
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" data-testid="button-cart">
                <ShoppingBag className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-profile">
                <User className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button data-testid="button-login">
              登录/注册
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
