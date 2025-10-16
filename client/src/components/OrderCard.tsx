import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Music2, Clock, ChevronRight } from "lucide-react";

export type OrderStatus = "pending" | "processing" | "completed" | "failed";

interface OrderCardProps {
  orderId: string;
  description: string;
  status: OrderStatus;
  createdAt: string;
  price: number;
  progress?: number;
  musicUrl?: string;
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待支付", variant: "secondary" },
  processing: { label: "生成中", variant: "default" },
  completed: { label: "已完成", variant: "outline" },
  failed: { label: "失败", variant: "destructive" },
};

export function OrderCard({
  orderId,
  description,
  status,
  createdAt,
  price,
  progress = 0,
  musicUrl,
}: OrderCardProps) {
  const handleDownload = () => {
    console.log("Downloading music:", musicUrl);
  };

  const handleViewDetails = () => {
    console.log("View order details:", orderId);
  };

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-order-${orderId}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Music2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium" data-testid={`text-order-id-${orderId}`}>
              订单 #{orderId}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {createdAt}
            </p>
          </div>
        </div>
        <Badge variant={statusConfig[status].variant} data-testid={`badge-status-${orderId}`}>
          {statusConfig[status].label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${orderId}`}>
          {description}
        </p>

        {status === "processing" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">生成进度</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} data-testid={`progress-${orderId}`} />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-lg font-semibold" data-testid={`text-price-${orderId}`}>
            ¥{price.toFixed(2)}
          </span>
          {status === "completed" ? (
            <Button
              size="sm"
              onClick={handleDownload}
              data-testid={`button-download-${orderId}`}
            >
              <Download className="w-4 h-4 mr-2" />
              下载音乐
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleViewDetails}
              data-testid={`button-details-${orderId}`}
            >
              查看详情
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
