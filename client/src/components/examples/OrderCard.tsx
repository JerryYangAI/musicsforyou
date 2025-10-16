import { OrderCard } from "../OrderCard";

export default function OrderCardExample() {
  return (
    <div className="p-8 bg-background min-h-screen space-y-6">
      <OrderCard
        orderId="M20231016001"
        description="流行风格，快乐氛围，包含夏天、海边等元素，时长60秒"
        status="completed"
        createdAt="2024-10-16 14:30"
        price={29.9}
        musicUrl="https://example.com/music.mp3"
      />
      <OrderCard
        orderId="M20231016002"
        description="摇滚风格，激昂情绪，包含自由、力量等关键词"
        status="processing"
        createdAt="2024-10-16 15:20"
        price={29.9}
        progress={65}
      />
      <OrderCard
        orderId="M20231016003"
        description="爵士风格，浪漫平静，钢琴主导"
        status="pending"
        createdAt="2024-10-16 16:00"
        price={29.9}
      />
    </div>
  );
}
