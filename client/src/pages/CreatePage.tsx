import { Header } from "@/components/Header";
import { MusicCustomizationForm } from "@/components/MusicCustomizationForm";
import { useLanguage } from "@/components/LanguageProvider";
import { SEO, pageSEO } from "@/components/SEO";

export default function CreatePage() {
  const { locale } = useLanguage();
  const seo = pageSEO.create[locale];
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={seo.title} 
        description={seo.description} 
        locale={locale} 
      />
      <Header />
      <div className="container mx-auto px-6 py-12">
        <MusicCustomizationForm />
      </div>
    </div>
  );
}
