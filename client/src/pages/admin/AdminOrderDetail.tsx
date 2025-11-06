import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SelectOrder } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

const statusColorMap: Record<string, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-gray-500",
  closed: "bg-gray-400",
};

export default function AdminOrderDetail() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, params] = useRoute("/admin/orders/:id");
  const orderId = params?.id;

  const [musicFileUrl, setMusicFileUrl] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const { data: order, isLoading } = useQuery<SelectOrder>({
    queryKey: [`/api/admin/orders/${orderId}`],
    enabled: !!orderId,
  });

  const uploadMusicMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("PUT", `/api/admin/orders/${orderId}/music`, { musicFileUrl: url });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.admin.uploadSuccess });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setMusicFileUrl("");
    },
    onError: (error: any) => {
      console.error("Upload music error:", error);
      toast({ title: t.admin.uploadFailed, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PUT", `/api/admin/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.admin.statusUpdated });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setSelectedStatus("");
    },
    onError: (error: any) => {
      console.error("Update status error:", error);
      toast({ title: t.admin.statusUpdateFailed, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-lg">Order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/admin/orders">
            <Button variant="ghost" className="mb-4" data-testid="button-back-orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.admin.backToOrders}
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">{t.admin.orderDetails}</h1>
          <p className="text-lg text-muted-foreground">
            {t.admin.orderId}: #{order.id.slice(0, 8)}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{t.admin.orderInfo}</CardTitle>
                  <CardDescription>
                    {new Date(order.createdAt).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge className={statusColorMap[order.status]}>
                  {t.orders[order.status as keyof typeof t.orders] || order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.admin.customer}</p>
                  <p className="font-medium">{order.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.admin.amount}</p>
                  <p className="font-medium text-lg">¥{(order.amount / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.admin.musicStyle}</p>
                  <p className="font-medium">{order.musicStyle || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.admin.musicMood}</p>
                  <p className="font-medium">{order.musicMood || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.admin.voiceType}</p>
                  <p className="font-medium">{order.voiceType || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.admin.duration}</p>
                  <p className="font-medium">{order.duration || "-"} {t.music.durationUnit}</p>
                </div>
              </div>

              {order.lyrics && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.music.lyrics}</p>
                  <p className="font-medium whitespace-pre-wrap">{order.lyrics}</p>
                </div>
              )}

              {order.songTitle && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.music.songTitle}</p>
                  <p className="font-medium">{order.songTitle}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.admin.uploadMusic}</CardTitle>
              <CardDescription>
                {order.musicFileUrl
                  ? t.orders.downloadReady
                  : t.orders.noMusicFile}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.musicFileUrl && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">{t.orders.musicFile}</p>
                  <a
                    href={order.musicFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {order.musicFileUrl}
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="musicFileUrl">{t.admin.musicFileUrl}</Label>
                <Input
                  id="musicFileUrl"
                  type="url"
                  placeholder={t.admin.musicFileUrlPlaceholder}
                  value={musicFileUrl}
                  onChange={(e) => setMusicFileUrl(e.target.value)}
                  data-testid="input-music-url"
                />
              </div>

              <Button
                onClick={() => uploadMusicMutation.mutate(musicFileUrl)}
                disabled={!musicFileUrl || uploadMusicMutation.isPending}
                data-testid="button-upload-music"
              >
                {uploadMusicMutation.isPending ? t.common.loading : t.admin.uploadMusic}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.admin.updateStatus}</CardTitle>
              <CardDescription>{t.orders.status}: {order.status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t.orders.status}</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder={t.orders.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t.orders.pending}</SelectItem>
                    <SelectItem value="processing">{t.orders.processing}</SelectItem>
                    <SelectItem value="completed">{t.orders.completed}</SelectItem>
                    <SelectItem value="failed">{t.orders.failed}</SelectItem>
                    <SelectItem value="cancelled">{t.orders.cancelled}</SelectItem>
                    <SelectItem value="closed">{t.orders.closed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => updateStatusMutation.mutate(selectedStatus)}
                disabled={!selectedStatus || updateStatusMutation.isPending}
                data-testid="button-update-status"
              >
                {updateStatusMutation.isPending ? t.common.loading : t.admin.updateStatus}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
