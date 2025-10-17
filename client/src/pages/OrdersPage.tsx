import { useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { OrderList } from "@/components/OrderList";
import { useAuth } from "@/components/AuthProvider";

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      <div className="container mx-auto px-6 py-12">
        <OrderList />
      </div>
    </div>
  );
}
