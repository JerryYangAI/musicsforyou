import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-16">
        <AuthForm />
      </div>
    </div>
  );
}
