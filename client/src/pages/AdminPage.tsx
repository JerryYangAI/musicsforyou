import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Download, Music, BarChart3, Package, LogOut } from "lucide-react";
import { useState } from "react";

interface Order {
  id: string;
  userId: string;
  username?: string;
  mood: string;
  style: string;
  description: string;
  duration: number;
  amount: number;
  status: string;
  musicFileUrl: string | null;
  createdAt: string;
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  failed: number;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [musicUrl, setMusicUrl] = useState("");
  const [newStatus, setNewStatus] = useState("");

  // Redirect if not admin
  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  // Fetch all orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  // Fetch order stats
  const { data: stats } = useQuery<OrderStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Upload music mutation
  const uploadMusicMutation = useMutation({
    mutationFn: async ({ orderId, url }: { orderId: string; url: string }) => {
      return apiRequest("PUT", `/api/admin/orders/${orderId}/music`, { musicFileUrl: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: t.admin.uploadSuccess,
      });
      setMusicUrl("");
      setSelectedOrder(null);
    },
    onError: () => {
      toast({
        title: t.admin.uploadFailed,
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest("PUT", `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: t.admin.statusUpdated,
      });
      setNewStatus("");
      setSelectedOrder(null);
    },
    onError: () => {
      toast({
        title: t.admin.statusUpdateFailed,
        variant: "destructive",
      });
    },
  });

  const handleUploadMusic = (orderId: string) => {
    if (!musicUrl.trim()) return;
    uploadMusicMutation.mutate({ orderId, url: musicUrl });
  };

  const handleUpdateStatus = (orderId: string) => {
    if (!newStatus) return;
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "processing":
        return "text-blue-600";
      case "failed":
        return "text-red-600";
      case "cancelled":
        return "text-gray-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" data-testid="text-admin-title">
            {t.admin.title}
          </h1>
          <Button 
            variant="outline" 
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t.header.logout}
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card data-testid="card-stat-total">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.admin.totalOrders}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-stat-total">{stats.total}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-pending">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.orders.pending}</CardTitle>
                <BarChart3 className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600" data-testid="text-stat-pending">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-processing">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.orders.processing}</CardTitle>
                <Music className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-stat-processing">{stats.processing}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-completed">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.orders.completed}</CardTitle>
                <Download className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-stat-completed">{stats.completed}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-cancelled">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.orders.cancelled}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600" data-testid="text-stat-cancelled">{stats.cancelled}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-failed">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.orders.failed}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="text-stat-failed">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Table */}
        <Card data-testid="card-orders-table">
          <CardHeader>
            <CardTitle>{t.admin.allOrders}</CardTitle>
            <CardDescription>
              {t.admin.ordersManagement}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.common.loading}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-orders">
                {t.orders.noOrders}
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg">
                            {order.style} - {order.mood}
                          </CardTitle>
                          <CardDescription>
                            {t.admin.customer}: {order.username || `User #${order.userId.slice(0, 8)}`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${getStatusColor(order.status)}`} data-testid={`text-status-${order.id}`}>
                            {t.orders[order.status as keyof typeof t.orders] || order.status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p className="text-sm" data-testid={`text-description-${order.id}`}>{order.description}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Duration:</span>
                            <span data-testid={`text-duration-${order.id}`}>{order.duration} seconds</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t.admin.amount}:</span>
                            <span className="font-semibold" data-testid={`text-amount-${order.id}`}>${order.amount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t.admin.createdAt}:</span>
                            <span data-testid={`text-created-${order.id}`}>{format(new Date(order.createdAt), "yyyy-MM-dd HH:mm")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Music File Status */}
                      {order.musicFileUrl && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <p className="text-sm text-green-800 flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            {t.orders.musicFile}: <a href={order.musicFileUrl} target="_blank" rel="noopener noreferrer" className="underline" data-testid={`link-music-${order.id}`}>
                              {t.orders.downloadReady}
                            </a>
                          </p>
                        </div>
                      )}

                      {/* Admin Actions */}
                      <div className="border-t pt-4 space-y-3">
                        {/* Upload Music */}
                        <div className="space-y-2">
                          <Label htmlFor={`music-url-${order.id}`}>{t.admin.uploadMusic}</Label>
                          <div className="flex gap-2 flex-wrap">
                            <Input
                              id={`music-url-${order.id}`}
                              placeholder={t.admin.musicFileUrlPlaceholder}
                              value={selectedOrder === order.id ? musicUrl : ""}
                              onChange={(e) => {
                                setSelectedOrder(order.id);
                                setMusicUrl(e.target.value);
                              }}
                              className="flex-1 min-w-[200px]"
                              data-testid={`input-music-url-${order.id}`}
                            />
                            <Button
                              onClick={() => handleUploadMusic(order.id)}
                              disabled={uploadMusicMutation.isPending || !musicUrl.trim() || selectedOrder !== order.id}
                              data-testid={`button-upload-music-${order.id}`}
                            >
                              <Music className="h-4 w-4 mr-2" />
                              {t.admin.uploadMusic}
                            </Button>
                          </div>
                        </div>

                        {/* Update Status */}
                        <div className="space-y-2">
                          <Label htmlFor={`status-${order.id}`}>{t.admin.updateStatus}</Label>
                          <div className="flex gap-2 flex-wrap">
                            <Select
                              value={selectedOrder === order.id ? newStatus : ""}
                              onValueChange={(value) => {
                                setSelectedOrder(order.id);
                                setNewStatus(value);
                              }}
                            >
                              <SelectTrigger className="flex-1 min-w-[200px]" data-testid={`select-status-${order.id}`}>
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
                            <Button
                              onClick={() => handleUpdateStatus(order.id)}
                              disabled={updateStatusMutation.isPending || !newStatus || selectedOrder !== order.id}
                              data-testid={`button-update-status-${order.id}`}
                            >
                              {t.admin.updateStatus}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
