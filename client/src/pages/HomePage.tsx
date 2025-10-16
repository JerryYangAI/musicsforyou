import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeatureSection />
      
      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/10 to-chart-2/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备好创作您的音乐了吗？
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            只需简单几步，AI即可为您生成专属音乐作品
          </p>
          <Button size="lg" data-testid="button-cta-start">
            立即开始创作
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
