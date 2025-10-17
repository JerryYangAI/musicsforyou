import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "./LanguageProvider";
import { useAuth } from "./AuthProvider";
import { Music, User, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

export function Header() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLoginClick = () => {
    setLocation("/auth");
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover-elevate px-3 py-2 rounded-md transition-all" data-testid="link-home">
          <div className="p-1.5 bg-gradient-to-br from-primary to-chart-2 rounded-lg">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">{t.header.brandName}</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/create" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-create">
            {t.header.create}
          </Link>
          <Link href="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-orders">
            {t.header.orders}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                title={user.username}
                data-testid="button-profile"
              >
                <User className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                title={t.header.logout}
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button onClick={handleLoginClick} data-testid="button-login">
              {t.header.login}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
