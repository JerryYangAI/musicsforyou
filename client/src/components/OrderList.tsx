import { useQuery } from "@tanstack/react-query";
import { OrderCard, type OrderStatus } from "./OrderCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Loader2 } from "lucide-react";
import type { Order } from "@shared/schema";

export function OrderList() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mapOrderStatus = (status: string): OrderStatus => {
    if (status === "completed") return "completed";
    if (status === "processing") return "processing";
    if (status === "failed") return "failed";
    return "pending";
  };

  const orderCards = orders.map((order) => ({
    orderId: order.id,
    description: order.musicDescription,
    status: mapOrderStatus(order.orderStatus),
    createdAt: formatDate(order.createdAt),
    price: parseFloat(order.amount),
    progress: order.orderStatus === "processing" ? 50 : undefined,
    musicUrl: undefined, // Will be populated when music track is linked
  }));

  const allOrders = orderCards;
  const completedOrders = orderCards.filter(o => o.status === "completed");
  const processingOrders = orderCards.filter(o => o.status === "processing");

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Music className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">我的订单</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无订单</p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-orders">
              全部订单 ({allOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed-orders">
              已完成 ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="processing" data-testid="tab-processing-orders">
              生成中 ({processingOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {allOrders.map((order) => (
              <OrderCard key={order.orderId} {...order} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedOrders.length > 0 ? (
              completedOrders.map((order) => (
                <OrderCard key={order.orderId} {...order} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">暂无已完成的订单</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="processing" className="space-y-4 mt-6">
            {processingOrders.length > 0 ? (
              processingOrders.map((order) => (
                <OrderCard key={order.orderId} {...order} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">暂无生成中的订单</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
