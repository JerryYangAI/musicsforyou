import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { SEO, pageSEO } from "@/components/SEO";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const { locale } = useLanguage();
  const [, setLocation] = useLocation();
  const seo = pageSEO.auth[locale];

  useEffect(() => {
    if (user) {
      setLocation("/create");
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={seo.title} 
        description={seo.description} 
        locale={locale} 
      />
      <Header />
      <div className="container mx-auto px-6 py-16">
        <AuthForm />
      </div>
    </div>
  );
}
