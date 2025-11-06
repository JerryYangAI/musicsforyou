import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "./LanguageProvider";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface OrderDetails {
  musicStyle: string;
  musicMoods: string[];
  musicDescription: string;
  songTitle?: string;
  voiceType: string;
  musicDuration: number;
  amount: number;
}

function CheckoutForm({ orderDetails }: { orderDetails: OrderDetails }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message);
      }

      // Payment successful - create order
      const orderData = {
        musicDescription: orderDetails.musicDescription,
        musicStyle: orderDetails.musicStyle,
        musicMoods: orderDetails.musicMoods,
        musicKeywords: orderDetails.songTitle ? [orderDetails.songTitle] : [],
        musicDuration: orderDetails.musicDuration,
        amount: orderDetails.amount.toString(),
        paymentMethod: "stripe",
        paymentStatus: "paid",
        orderStatus: "processing",
      };

      await apiRequest("POST", "/api/orders", orderData);

      // Clear session storage
      sessionStorage.removeItem("orderDetails");

      toast({
        title: t.common.success,
        description: "支付成功！我们将立即开始制作您的音乐。",
      });

      setLocation("/orders");
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: t.common.error,
        description: err.message || "支付失败，请重试",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing}
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            处理中...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            确认支付 ¥{orderDetails.amount}
          </>
        )}
      </Button>
    </form>
  );
}

interface StripePaymentFormProps {
  orderDetails: OrderDetails;
}

export function StripePaymentForm({ orderDetails }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: Math.round(orderDetails.amount * 100), // Convert to cents
          currency: "cny",
        });

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        toast({
          title: t.common.error,
          description: "创建支付失败，请刷新重试",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [orderDetails.amount]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">正在准备支付...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-destructive">支付初始化失败</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#8B5CF6",
            colorBackground: "#ffffff",
            colorText: "#1f2937",
            borderRadius: "8px",
          },
        },
      }}
    >
      <CheckoutForm orderDetails={orderDetails} />
    </Elements>
  );
}
