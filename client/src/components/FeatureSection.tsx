import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "./LanguageProvider";
import { Zap, Sparkles, Clock, Award } from "lucide-react";

export function FeatureSection() {
  const { t, locale } = useLanguage();
  
  const features = [
    {
      icon: Sparkles,
      title: t.features.professional,
      description: t.features.professionalDesc,
    },
    {
      icon: Award,
      title: t.features.customization,
      description: t.features.customizationDesc,
    },
    {
      icon: Zap,
      title: t.features.fastDelivery,
      description: t.features.fastDeliveryDesc,
    },
    {
      icon: Clock,
      title: t.features.highQuality,
      description: t.features.highQualityDesc,
    },
  ];

  return (
    <section id="features" className="py-24 px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {t.features.title}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            {t.features.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {locale === 'zh' 
              ? '专业团队，为您打造独一无二的音乐体验' 
              : 'Professional team creating unique music experiences for you'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover-elevate transition-all duration-300 border-2 hover:border-primary/30 hover:shadow-xl relative overflow-hidden"
            >
              {/* 渐变背景效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <CardHeader className="relative z-10">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
