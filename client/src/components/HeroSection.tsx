import { Button } from "@/components/ui/button";
import { useLanguage } from "./LanguageProvider";
import { Music, Sparkles, Zap } from "lucide-react";

export function HeroSection() {
  const { t } = useLanguage();
  
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-chart-2 to-primary opacity-90" />

      {/* Animated Sound Wave Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 200 + 50}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${Math.random() * 2 + 1}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 text-white">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">{t.hero.title}</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          {t.hero.subtitle}
        </h1>

        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          {t.hero.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 text-white px-8"
            data-testid="button-create-music"
          >
            <Music className="w-5 h-5 mr-2" />
            {t.hero.getStarted}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-white/10 backdrop-blur-md hover:bg-white/20 border-white/40 text-white px-8"
            data-testid="button-view-examples"
          >
            <Zap className="w-5 h-5 mr-2" />
            {t.hero.learnMore}
          </Button>
        </div>
      </div>
    </section>
  );
}
