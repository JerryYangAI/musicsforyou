import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  const toggleLanguage = () => {
    setLocale(locale === "zh" ? "en" : "zh");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      data-testid="button-language-toggle"
      title={locale === "zh" ? "Switch to English" : "切换到中文"}
    >
      <Languages className="h-5 w-5" />
      <span className="sr-only">
        {locale === "zh" ? "Switch to English" : "切换到中文"}
      </span>
    </Button>
  );
}
