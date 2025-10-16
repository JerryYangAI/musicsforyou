import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Download, Sparkles } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI智能创作",
    description: "先进的AI音乐生成技术，根据您的描述创作独特音乐",
  },
  {
    icon: Zap,
    title: "快速生成",
    description: "支付完成后即刻开始生成，通常在2-5分钟内完成",
  },
  {
    icon: Shield,
    title: "安全支付",
    description: "支持国际信用卡和微信支付，所有交易均经过加密保护",
  },
  {
    icon: Download,
    title: "高品质下载",
    description: "支持高品质音频格式下载，满足各种使用场景",
  },
];

export function FeatureSection() {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">为什么选择我们</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            专业的AI音乐生成服务，让创作变得简单高效
          </p>
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
