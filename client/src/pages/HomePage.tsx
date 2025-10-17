import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";
import { MusicLeaderboard } from "@/components/MusicLeaderboard";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleCTAClick = () => {
    if (user) {
      setLocation("/create");
    } else {
      setLocation("/auth");
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeatureSection />
      <MusicLeaderboard />
      
      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/10 to-chart-2/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.cta.title}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.cta.subtitle}
          </p>
          <Button size="lg" onClick={handleCTAClick} data-testid="button-cta-start">
            {t.cta.startNow}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
