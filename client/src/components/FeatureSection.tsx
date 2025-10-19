import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "./LanguageProvider";
import { Zap, Sparkles, Clock, Award } from "lucide-react";

export function FeatureSection() {
  const { t } = useLanguage();
  
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
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.features.title}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
