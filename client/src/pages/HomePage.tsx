import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";
import { MusicLeaderboard } from "@/components/MusicLeaderboard";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { SEO, pageSEO } from "@/components/SEO";

export default function HomePage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleCTAClick = () => {
    if (user) {
      setLocation("/create");
    } else {
      setLocation("/auth");
    }
  };
  
  const seo = pageSEO.home[locale];
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title={seo.title} 
        description={seo.description} 
        locale={locale} 
      />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeatureSection />
        <MusicLeaderboard />
        
        {/* CTA Section */}
        <section className="relative py-24 px-6 overflow-hidden">
          {/* 背景渐变 */}
          <div className="absolute inset-0 gradient-primary opacity-10" />
          
          {/* 装饰性元素 */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-chart-2/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          
          <div className="container mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {locale === 'zh' ? '开始您的音乐之旅' : 'Start Your Music Journey'}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 gradient-text">
              {t.cta.title}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              {t.cta.subtitle}
            </p>
            <Button 
              size="lg" 
              onClick={handleCTAClick} 
              className="group gradient-primary text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
              data-testid="button-cta-start"
            >
              {t.cta.startNow}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
