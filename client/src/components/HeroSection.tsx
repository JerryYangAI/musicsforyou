import { Button } from "@/components/ui/button";
import { Music, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useLocation } from "wouter";
import { useAuth } from "./AuthProvider";

export function HeroSection() {
  const { t, locale } = useLanguage();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const handleGetStarted = () => {
    if (user) {
      setLocation("/create");
    } else {
      setLocation("/auth");
    }
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 动态渐变背景 */}
      <div className="absolute inset-0 gradient-primary opacity-90" />
      
      {/* 动画网格背景 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      {/* 音乐波形动画 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="flex items-end gap-1 h-32">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white rounded-full"
              style={{
                height: `${Math.random() * 100 + 20}%`,
                animation: `wave ${Math.random() * 1 + 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 浮动音乐图标 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${i * 2}s`,
            }}
          >
            <Music className="w-16 h-16 text-white" />
          </div>
        ))}
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        {/* 标签徽章 */}
        <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full mb-8 text-white backdrop-blur-md">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-semibold">{t.hero.subtitle}</span>
        </div>

        {/* 主标题 */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight leading-tight">
          <span className="block mb-2">{t.hero.title}</span>
          <span className="block gradient-text bg-clip-text text-transparent">
            {locale === 'zh' ? '定制音乐惊喜' : 'Custom Music Magic'}
          </span>
        </h1>

        {/* 描述文字 */}
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
          {t.hero.description}
        </p>

        {/* CTA按钮组 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="group gradient-primary text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
            data-testid="button-create-music"
          >
            <Music className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
            {t.hero.getStarted}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleLearnMore}
            className="glass border-white/30 text-white px-8 py-6 text-lg font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
            data-testid="button-view-examples"
          >
            <Zap className="w-5 h-5 mr-2" />
            {t.hero.learnMore}
          </Button>
        </div>

        {/* 信任指标 */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-white/80 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>{locale === 'zh' ? 'AI智能生成' : 'AI Powered'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span>{locale === 'zh' ? '快速交付' : 'Fast Delivery'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span>{locale === 'zh' ? '专业品质' : 'Professional Quality'}</span>
          </div>
        </div>
      </div>

      {/* 滚动提示 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
        </div>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.5);
          }
          50% {
            transform: scaleY(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
      `}</style>
    </section>
  );
}
