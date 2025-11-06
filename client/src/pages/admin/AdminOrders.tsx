import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { SelectOrder } from "@shared/schema";

const statusColorMap: Record<string, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-gray-500",
  closed: "bg-gray-400",
};

export default function AdminOrders() {
  const { t } = useLanguage();

  const { data: orders, isLoading } = useQuery<SelectOrder[]>({
    queryKey: ["/api/admin/orders"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t.admin.ordersManagement}</h1>
            <p className="text-lg text-muted-foreground">{t.admin.allOrders}</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" data-testid="button-back-dashboard">
              {t.admin.dashboard}
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.admin.allOrders}</CardTitle>
            <CardDescription>
              {t.admin.totalOrders}: {orders?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!orders || orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t.orders.noOrders}</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover-elevate"
                    data-testid={`card-order-${order.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{order.id.slice(0, 8)}
                          </span>
                          <Badge className={statusColorMap[order.status]}>
                            {t.orders[order.status as keyof typeof t.orders] || order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.admin.customer}: {order.userId}
                        </p>
                        <p className="text-sm">
                          {t.admin.musicStyle}: {order.musicStyle || "-"}
                        </p>
                        <p className="text-sm">
                          {t.admin.createdAt}: {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          ¥{(order.amount / 100).toFixed(2)}
                        </p>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button size="sm" className="mt-2" data-testid={`button-view-order-${order.id}`}>
                            {t.orders.viewDetails}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
