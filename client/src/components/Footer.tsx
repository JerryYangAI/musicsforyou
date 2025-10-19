import { useLanguage } from "./LanguageProvider";
import { Link } from "wouter";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {t.footer.copyright}
          </div>
          <div className="flex gap-6">
            <Link href="/about">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">
                {t.footer.aboutUs}
              </a>
            </Link>
            <Link href="/contact">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-contact">
                {t.footer.contactUs}
              </a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
