import { OrderCard, type OrderStatus } from "./OrderCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music } from "lucide-react";

//todo: remove mock functionality
const mockOrders = [
  {
    orderId: "M20231016001",
    description: "流行风格，快乐氛围，包含夏天、海边等元素，时长60秒",
    status: "completed" as OrderStatus,
    createdAt: "2024-10-16 14:30",
    price: 29.9,
    musicUrl: "https://example.com/music.mp3",
  },
  {
    orderId: "M20231016002",
    description: "摇滚风格，激昂情绪，包含自由、力量等关键词，时长90秒",
    status: "processing" as OrderStatus,
    createdAt: "2024-10-16 15:20",
    price: 29.9,
    progress: 65,
  },
  {
    orderId: "M20231016003",
    description: "爵士风格，浪漫平静，钢琴主导，适合晚餐背景音乐",
    status: "pending" as OrderStatus,
    createdAt: "2024-10-16 16:00",
    price: 29.9,
  },
  {
    orderId: "M20231015001",
    description: "电子音乐，神秘科技感，适合游戏配乐",
    status: "completed" as OrderStatus,
    createdAt: "2024-10-15 10:15",
    price: 29.9,
    musicUrl: "https://example.com/music2.mp3",
  },
];

export function OrderList() {
  const allOrders = mockOrders;
  const completedOrders = mockOrders.filter(o => o.status === "completed");
  const processingOrders = mockOrders.filter(o => o.status === "processing");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Music className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">我的订单</h2>
      </div>

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
          {completedOrders.map((order) => (
            <OrderCard key={order.orderId} {...order} />
          ))}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4 mt-6">
          {processingOrders.map((order) => (
            <OrderCard key={order.orderId} {...order} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
