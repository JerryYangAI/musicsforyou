import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
}

export default function AdminDashboard() {
  const { t, locale } = useLanguage();

  const { data: stats, isLoading } = useQuery<OrderStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    );
  }

  const statsCards = [
    {
      title: t.admin.totalOrders,
      value: stats?.totalOrders || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: t.admin.totalRevenue,
      value: `¥${((stats?.totalRevenue || 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t.admin.pendingOrders,
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: t.admin.completedOrders,
      value: stats?.completedOrders || 0,
      icon: CheckCircle2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t.admin.title}</h1>
          <p className="text-lg text-muted-foreground">{t.admin.dashboard}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <Card key={index} data-testid={`card-stat-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-stat-value-${index}`}>
                  {card.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.admin.ordersManagement}</CardTitle>
              <CardDescription>{t.admin.allOrders}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/orders">
                <Button data-testid="button-view-orders">{t.admin.allOrders}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "zh" ? "展示音乐管理" : "Showcase Music Management"}</CardTitle>
              <CardDescription>
                {locale === "zh" ? "添加展示音乐到首页榜单" : "Add showcase music to homepage leaderboard"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/showcase-music">
                <Button data-testid="button-showcase-music">
                  {locale === "zh" ? "管理展示音乐" : "Manage Showcase Music"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
