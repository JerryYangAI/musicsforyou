import { Header } from "../Header";
import { ThemeProvider } from "../ThemeProvider";

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <div className="bg-background min-h-screen">
        <Header isAuthenticated={true} />
        <div className="p-8">
          <p className="text-muted-foreground">页面内容区域...</p>
        </div>
      </div>
    </ThemeProvider>
  );
}
