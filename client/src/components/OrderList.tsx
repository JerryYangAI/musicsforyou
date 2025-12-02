import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "./LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Music, Loader2, Download, Clock, Play, Pause, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, SelectReview } from "@shared/schema";
import { format } from "date-fns";

interface ReviewFormState {
  [orderId: string]: {
    rating: number;
    comment: string;
  };
}

export function OrderList() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [reviewForms, setReviewForms] = useState<ReviewFormState>({});
  const [orderReviews, setOrderReviews] = useState<{ [orderId: string]: SelectReview }>({});
  const [generationProgress, setGenerationProgress] = useState<{ [orderId: string]: { progress: number; status: string } }>({});
  const progressIntervals = useRef<{ [orderId: string]: NodeJS.Timeout }>({});

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.src = "";
      });
    };
  }, [audioElements]);

  // Fetch reviews for each completed order with music file
  useEffect(() => {
    orders
      .filter(o => o.musicFileUrl && o.orderStatus === "completed")
      .forEach(async (order) => {
        try {
          const response = await fetch(`/api/orders/${order.id}/review`);
          if (response.ok) {
            const review = await response.json();
            setOrderReviews(prev => ({ ...prev, [order.id]: review }));
          }
        } catch (error) {
          // Review doesn't exist yet, which is fine
        }
      });
  }, [orders]);

  // Poll generation progress for processing orders
  useEffect(() => {
    const processingOrders = orders.filter(o => o.orderStatus === "processing" || o.orderStatus === "pending");
    
    processingOrders.forEach((order) => {
      // Clear existing interval if any
      if (progressIntervals.current[order.id]) {
        clearInterval(progressIntervals.current[order.id]);
      }

      // Start polling
      const pollProgress = async () => {
        try {
          const response = await fetch(`/api/music/generation/${order.id}/status`);
          if (response.ok) {
            const data = await response.json();
            setGenerationProgress(prev => ({
              ...prev,
              [order.id]: { progress: data.progress || 0, status: data.status || order.orderStatus }
            }));

            // If completed or failed, stop polling and refresh orders
            if (data.status === "completed" || data.status === "failed") {
              clearInterval(progressIntervals.current[order.id]);
              delete progressIntervals.current[order.id];
              queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            }
          }
        } catch (error) {
          console.error("Error polling generation progress:", error);
        }
      };

      // Poll immediately, then every 3 seconds
      pollProgress();
      progressIntervals.current[order.id] = setInterval(pollProgress, 3000);
    });

    // Cleanup: clear intervals for orders that are no longer processing
    Object.keys(progressIntervals.current).forEach((orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (!order || (order.orderStatus !== "processing" && order.orderStatus !== "pending")) {
        clearInterval(progressIntervals.current[orderId]);
        delete progressIntervals.current[orderId];
      }
    });

    // Cleanup on unmount
    return () => {
      Object.values(progressIntervals.current).forEach(interval => clearInterval(interval));
    };
  }, [orders]);

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

  const handlePlayPause = (orderId: string, musicUrl: string) => {
    if (playingAudio === orderId) {
      audioElements[orderId]?.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio) {
        audioElements[playingAudio]?.pause();
      }
      
      let audio = audioElements[orderId];
      if (!audio) {
        audio = new Audio(musicUrl);
        audio.onended = () => setPlayingAudio(null);
        setAudioElements(prev => ({ ...prev, [orderId]: audio }));
      }
      
      audio.play();
      setPlayingAudio(orderId);
    }
  };

  const submitReviewMutation = useMutation({
    mutationFn: async ({ orderId, rating, comment }: { orderId: string; rating: number; comment: string }) => {
      const response = await apiRequest("POST", "/api/reviews", { orderId, rating, comment });
      const review = await response.json();
      return { orderId, review };
    },
    onSuccess: ({ orderId, review }) => {
      toast({ title: t.orders.reviewSubmitted });
      setOrderReviews(prev => ({ ...prev, [orderId]: review }));
      setReviewForms(prev => {
        const newForms = { ...prev };
        delete newForms[orderId];
        return newForms;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      const message = error.message?.includes("already exists") 
        ? t.orders.alreadyReviewed 
        : t.orders.reviewFailed;
      toast({ title: message, variant: "destructive" });
    },
  });

  const handleSubmitReview = (orderId: string) => {
    const form = reviewForms[orderId];
    if (!form || form.rating === 0) {
      toast({ title: t.orders.rating, variant: "destructive" });
      return;
    }
    submitReviewMutation.mutate({
      orderId,
      rating: form.rating,
      comment: form.comment,
    });
  };

  const setReviewRating = (orderId: string, rating: number) => {
    setReviewForms(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], rating, comment: prev[orderId]?.comment || "" }
    }));
  };

  const setReviewComment = (orderId: string, comment: string) => {
    setReviewForms(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], rating: prev[orderId]?.rating || 0, comment }
    }));
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

        {/* Music Generation Progress */}
        {(order.orderStatus === "processing" || order.orderStatus === "pending") && generationProgress[order.id] && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.orders.generating || "生成中..."}
              </span>
              <span className="font-medium">{generationProgress[order.id].progress}%</span>
            </div>
            <Progress value={generationProgress[order.id].progress} className="h-2" />
          </div>
        )}

        {order.musicFileUrl && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Music className="h-4 w-4" />
                <span>{t.orders.musicFile}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePlayPause(order.id, order.musicFileUrl!)}
                  data-testid={`button-preview-${order.id}`}
                >
                  {playingAudio === order.id ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      {t.orders.preview}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t.orders.preview}
                    </>
                  )}
                </Button>
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

            {/* Review Section */}
            <div className="pt-3 border-t">
              {orderReviews[order.id] ? (
                // Display existing review
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.orders.rating}</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          orderReviews[order.id].rating >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {orderReviews[order.id].rating}/5
                    </span>
                  </div>
                  {orderReviews[order.id].comment && (
                    <div>
                      <Label className="text-sm font-medium">{t.orders.comment}</Label>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-review-comment-${order.id}`}>
                        {orderReviews[order.id].comment}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Show review form if no review exists
                <div>
                  <Label className="text-sm font-medium mb-2 block">{t.orders.writeReview}</Label>
                  
                  {/* Star Rating */}
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(order.id, star)}
                        className="hover-elevate p-1 rounded"
                        data-testid={`button-rating-${star}-${order.id}`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            (reviewForms[order.id]?.rating || 0) >= star
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    {reviewForms[order.id]?.rating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {reviewForms[order.id].rating}/5
                      </span>
                    )}
                  </div>

                  {/* Comment */}
                  <Textarea
                    placeholder={t.orders.commentPlaceholder}
                    value={reviewForms[order.id]?.comment || ""}
                    onChange={(e) => setReviewComment(order.id, e.target.value)}
                    className="mb-2"
                    data-testid={`textarea-comment-${order.id}`}
                  />

                  <Button
                    size="sm"
                    onClick={() => handleSubmitReview(order.id)}
                    disabled={!reviewForms[order.id]?.rating || submitReviewMutation.isPending}
                    data-testid={`button-submit-review-${order.id}`}
                  >
                    {submitReviewMutation.isPending ? t.common.loading : t.orders.submitReview}
                  </Button>
                </div>
              )}
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
