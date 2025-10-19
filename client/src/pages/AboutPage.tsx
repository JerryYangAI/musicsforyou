import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, Sparkles } from "lucide-react";

export default function AboutPage() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Target,
      title: t.about.mission,
      content: t.about.missionContent,
    },
    {
      icon: Users,
      title: t.about.team,
      content: t.about.teamContent,
    },
    {
      icon: Sparkles,
      title: t.about.service,
      content: t.about.serviceContent,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4" data-testid="text-about-title">
                {t.about.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t.about.subtitle}
              </p>
            </div>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <Card key={index} className="hover-elevate transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <section.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {section.content}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
