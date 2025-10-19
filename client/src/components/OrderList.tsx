import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "./LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Loader2, Download, Clock } from "lucide-react";
import type { Order } from "@shared/schema";
import { format } from "date-fns";

export function OrderList() {
  const { t } = useLanguage();
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const completedOrders = orders.filter(o => o.orderStatus === "completed");
  const processingOrders = orders.filter(o => o.orderStatus === "processing");

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderOrder = (order: Order) => (
    <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              {order.musicStyle} - {order.musicMoods.join(", ")}
            </CardTitle>
            <CardDescription>
              {format(new Date(order.createdAt), "yyyy-MM-dd HH:mm")}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(order.orderStatus)} data-testid={`badge-status-${order.id}`}>
            {t.orders[order.orderStatus as keyof typeof t.orders] || order.orderStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t.orders.orderDetails}</p>
          <p className="text-sm" data-testid={`text-description-${order.id}`}>{order.musicDescription}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span data-testid={`text-duration-${order.id}`}>{order.musicDuration} seconds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t.admin.amount}:</span>
            <span className="font-semibold" data-testid={`text-amount-${order.id}`}>${order.amount}</span>
          </div>
        </div>

        {order.musicFileUrl && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Music className="h-4 w-4" />
                <span>{t.orders.musicFile}</span>
              </div>
              <Button 
                asChild
                size="sm"
                data-testid={`button-download-${order.id}`}
              >
                <a href={order.musicFileUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-4 w-4 mr-2" />
                  {t.orders.download}
                </a>
              </Button>
            </div>
          </div>
        )}

        {!order.musicFileUrl && order.orderStatus === "completed" && (
          <div className="pt-3 border-t text-sm text-muted-foreground">
            {t.orders.noMusicFile}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Music className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">{t.orders.title}</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12" data-testid="text-no-orders">
          <p className="text-muted-foreground">{t.orders.noOrders}</p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-orders">
              {t.admin.allOrders} ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed-orders">
              {t.orders.completed} ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="processing" data-testid="tab-processing-orders">
              {t.orders.processing} ({processingOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {orders.map(renderOrder)}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedOrders.length > 0 ? (
              completedOrders.map(renderOrder)
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t.orders.noOrders}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="processing" className="space-y-4 mt-6">
            {processingOrders.length > 0 ? (
              processingOrders.map(renderOrder)
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t.orders.noOrders}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
