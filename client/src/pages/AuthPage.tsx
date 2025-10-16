import { Header } from "@/components/Header";
import { AuthForm } from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-12 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <AuthForm />
      </div>
    </div>
  );
}
