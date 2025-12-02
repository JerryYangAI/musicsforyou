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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CreditCard, Smartphone, QrCode } from "lucide-react";
import { SiWechat, SiAlipay } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "./LanguageProvider";

// Use test key in development, production key in production
const stripePublicKey = import.meta.env.MODE === 'production'
  ? import.meta.env.VITE_STRIPE_PUBLIC_KEY
  : import.meta.env.TESTING_VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY;

const stripePromise = loadStripe(stripePublicKey!);

interface OrderDetails {
  musicStyle: string;
  musicMoods: string[];
  musicDescription: string;
  songTitle?: string;
  voiceType: string;
  musicDuration: number;
  amount: number;
}

type PaymentMethod = "card" | "wechat" | "alipay";

function CheckoutForm({ 
  orderDetails, 
  paymentMethod,
  onPaymentMethodChange 
}: { 
  orderDetails: OrderDetails;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useState<NodeJS.Timeout | null>(null);

  // Poll payment status for WeChat Pay and Alipay
  useEffect(() => {
    if ((paymentMethod === "wechat" || paymentMethod === "alipay") && qrCodeUrl && !isPolling) {
      setIsPolling(true);
      const paymentIntentId = sessionStorage.getItem("paymentIntentId");
      if (paymentIntentId) {
        const interval = setInterval(async () => {
          try {
            const response = await fetch(`/api/payment-intent/${paymentIntentId}/status`);
            if (!response.ok) {
              return;
            }
            const data = await response.json();
            
            if (data.status === "succeeded") {
              // Payment successful
              clearInterval(interval);
              setIsPolling(false);
              await handlePaymentSuccess();
            } else if (data.status === "canceled" || data.status === "payment_failed") {
              // Payment failed
              clearInterval(interval);
              setIsPolling(false);
              toast({
                title: t.common.error,
                description: locale === 'zh' ? "支付失败，请重试" : "Payment failed, please try again",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error("Error polling payment status:", error);
          }
        }, 3000); // Poll every 3 seconds
        
        // Stop polling after 10 minutes
        setTimeout(() => {
          clearInterval(interval);
          setIsPolling(false);
        }, 600000);

        // Cleanup on unmount
        return () => {
          clearInterval(interval);
        };
      }
    }
  }, [qrCodeUrl, paymentMethod]);

  const handlePaymentSuccess = async () => {
    const orderData = {
      musicDescription: orderDetails.musicDescription,
      musicStyle: orderDetails.musicStyle,
      musicMoods: orderDetails.musicMoods,
      musicKeywords: orderDetails.songTitle ? [orderDetails.songTitle] : [],
      musicDuration: orderDetails.musicDuration,
      amount: orderDetails.amount.toString(),
      paymentMethod: paymentMethod,
      paymentStatus: "paid",
      orderStatus: "processing",
    };

    await apiRequest("POST", "/api/orders", orderData);

    // Clear session storage
    sessionStorage.removeItem("orderDetails");
    sessionStorage.removeItem("paymentIntentId");

    toast({
      title: t.common.success,
      description: locale === 'zh' ? "支付成功！我们将立即开始制作您的音乐。" : "Payment successful! We will start creating your music immediately.",
    });

    setLocation("/orders");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "card") {
      // Card payment
      if (!stripe || !elements) {
        return;
      }

      setIsProcessing(true);

      try {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw new Error(submitError.message);
        }

        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/orders`,
          },
          redirect: "if_required",
        });

        if (error) {
          throw new Error(error.message);
        }

        if (paymentIntent?.status === "succeeded") {
          await handlePaymentSuccess();
        }
      } catch (err: any) {
        console.error("Payment error:", err);
        toast({
          title: t.common.error,
          description: err.message || (locale === 'zh' ? "支付失败，请重试" : "Payment failed, please try again"),
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // WeChat Pay or Alipay - need to confirm payment intent first
      setIsProcessing(true);
      
      try {
        const paymentIntentId = sessionStorage.getItem("paymentIntentId");
        if (!paymentIntentId || !stripe) {
          throw new Error("Payment intent not found");
        }

        // Retrieve payment intent to get client secret
        const { error: retrieveError, paymentIntent: retrievedIntent } = await stripe.retrievePaymentIntent(paymentIntentId);
        
        if (retrieveError || !retrievedIntent) {
          throw new Error(retrieveError?.message || "Failed to retrieve payment intent");
        }

        // Confirm payment intent for WeChat Pay or Alipay
        const { error, paymentIntent } = await stripe.confirmPayment({
          clientSecret: retrievedIntent.client_secret!,
          confirmParams: {
            return_url: `${window.location.origin}/orders`,
          },
          redirect: "if_required",
        });

        if (error) {
          throw new Error(error.message);
        }

        // Check for next_action (QR code)
        if (paymentIntent?.next_action) {
          const nextAction = paymentIntent.next_action;
          
          // Handle WeChat Pay QR code
          if (nextAction.type === "wechat_pay_display_qr_code") {
            const wechatPayAction = nextAction as any;
            // QR code data can be in different formats
            const qrCodeData = wechatPayAction.wechat_pay_display_qr_code?.data || 
                              wechatPayAction.data?.qr_code ||
                              wechatPayAction.data;
            if (qrCodeData) {
              setQrCodeUrl(qrCodeData);
              setIsProcessing(false);
              return;
            }
          }
          
          // Handle Alipay QR code
          if (nextAction.type === "alipay_display_qr_code") {
            const alipayAction = nextAction as any;
            // QR code data can be in different formats
            const qrCodeData = alipayAction.alipay_display_qr_code?.data || 
                              alipayAction.data?.qr_code ||
                              alipayAction.data;
            if (qrCodeData) {
              setQrCodeUrl(qrCodeData);
              setIsProcessing(false);
              return;
            }
          }
        }
        
        // If no QR code found but payment is still processing, start polling
        if (paymentIntent?.status === "requires_action" || paymentIntent?.status === "processing") {
          setIsProcessing(false);
          // Start polling for status
          const interval = setInterval(async () => {
            try {
              const statusResponse = await fetch(`/api/payment-intent/${paymentIntentId}/status`);
              if (!statusResponse.ok) return;
              const statusData = await statusResponse.json();
              
              if (statusData.status === "succeeded") {
                clearInterval(interval);
                await handlePaymentSuccess();
              } else if (statusData.status === "canceled" || statusData.status === "payment_failed") {
                clearInterval(interval);
                toast({
                  title: t.common.error,
                  description: locale === 'zh' ? "支付失败，请重试" : "Payment failed, please try again",
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Error polling payment status:", error);
            }
          }, 3000);
          
          setTimeout(() => clearInterval(interval), 600000);
        }

        // If payment already succeeded
        if (paymentIntent?.status === "succeeded") {
          await handlePaymentSuccess();
        } else {
          // Poll for status
          setIsProcessing(false);
        }
      } catch (err: any) {
        console.error("Payment error:", err);
        toast({
          title: t.common.error,
          description: err.message || (locale === 'zh' ? "支付失败，请重试" : "Payment failed, please try again"),
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    }
  };

  // Show QR code for WeChat Pay or Alipay
  if (qrCodeUrl && (paymentMethod === "wechat" || paymentMethod === "alipay")) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            {paymentMethod === "wechat" ? (
              <SiWechat className="w-6 h-6 text-[#07C160]" />
            ) : (
              <SiAlipay className="w-6 h-6 text-[#1677FF]" />
            )}
            <h3 className="text-lg font-semibold">
              {locale === 'zh' 
                ? (paymentMethod === "wechat" ? "请使用微信扫码支付" : "请使用支付宝扫码支付")
                : (paymentMethod === "wechat" ? "Please scan QR code with WeChat" : "Please scan QR code with Alipay")
              }
            </h3>
          </div>
          <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed">
            <img 
              src={qrCodeUrl} 
              alt="Payment QR Code" 
              className="w-64 h-64"
            />
          </div>
          {isPolling && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{locale === 'zh' ? "等待支付确认..." : "Waiting for payment confirmation..."}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentMethod === "card" && <PaymentElement />}
      
      {paymentMethod !== "card" && (
        <div className="p-4 bg-accent/30 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {paymentMethod === "wechat" ? (
              <>
                <SiWechat className="w-5 h-5 text-[#07C160]" />
                <span className="font-medium">{locale === 'zh' ? "微信支付" : "WeChat Pay"}</span>
              </>
            ) : (
              <>
                <SiAlipay className="w-5 h-5 text-[#1677FF]" />
                <span className="font-medium">{locale === 'zh' ? "支付宝" : "Alipay"}</span>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {locale === 'zh' 
              ? "点击确认后将显示支付二维码" 
              : "Click confirm to display payment QR code"
            }
          </p>
        </div>
      )}
      
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
            {locale === 'zh' ? "处理中..." : "Processing..."}
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            {locale === 'zh' 
              ? `确认支付 ¥${orderDetails.amount}`
              : `Confirm Payment ¥${orderDetails.amount}`
            }
          </>
        )}
      </Button>
    </form>
  );
}

interface StripePaymentFormProps {
  orderDetails: OrderDetails;
  paymentMethod?: PaymentMethod;
  onPaymentMethodChange?: (method: PaymentMethod) => void;
}

export function StripePaymentForm({ 
  orderDetails,
  paymentMethod: externalPaymentMethod,
  onPaymentMethodChange: externalOnPaymentMethodChange
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(externalPaymentMethod || "card");
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (externalOnPaymentMethodChange) {
      externalOnPaymentMethodChange(method);
    }
    // Recreate payment intent when payment method changes
    setLoading(true);
    createPaymentIntent(method);
  };

  const createPaymentIntent = async (method: PaymentMethod = paymentMethod) => {
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: Math.round(orderDetails.amount * 100), // Convert to cents
        currency: "cny",
        paymentMethod: method,
      });

      const data = await response.json();
      setClientSecret(data.clientSecret);
      
      // Store payment intent ID for status polling
      if (data.paymentIntentId) {
        sessionStorage.setItem("paymentIntentId", data.paymentIntentId);
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      toast({
        title: t.common.error,
        description: locale === 'zh' ? "创建支付失败，请刷新重试" : "Failed to create payment, please refresh and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createPaymentIntent();
  }, []);

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
    <div className="space-y-6">
      {/* Payment Method Selector */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          {locale === 'zh' ? "选择支付方式" : "Select Payment Method"}
        </Label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => handlePaymentMethodChange(value as PaymentMethod)}
          className="space-y-3"
        >
          {/* Credit Card */}
          <div
            className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover-elevate ${
              paymentMethod === "card"
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
            onClick={() => handlePaymentMethodChange("card")}
          >
            <RadioGroupItem value="card" id="card" className="mt-1" />
            <Label htmlFor="card" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold">
                    {locale === 'zh' ? "信用卡" : "Credit Card"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {locale === 'zh' 
                      ? "支持 Visa、Mastercard、American Express"
                      : "Visa, Mastercard, American Express"
                    }
                  </div>
                </div>
              </div>
            </Label>
          </div>

          {/* WeChat Pay */}
          <div
            className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover-elevate ${
              paymentMethod === "wechat"
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
            onClick={() => handlePaymentMethodChange("wechat")}
          >
            <RadioGroupItem value="wechat" id="wechat" className="mt-1" />
            <Label htmlFor="wechat" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <SiWechat className="w-5 h-5 text-[#07C160]" />
                <div>
                  <div className="font-semibold">
                    {locale === 'zh' ? "微信支付" : "WeChat Pay"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {locale === 'zh' ? "使用微信扫码支付" : "Scan QR code with WeChat"}
                  </div>
                </div>
              </div>
            </Label>
          </div>

          {/* Alipay */}
          <div
            className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover-elevate ${
              paymentMethod === "alipay"
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
            onClick={() => handlePaymentMethodChange("alipay")}
          >
            <RadioGroupItem value="alipay" id="alipay" className="mt-1" />
            <Label htmlFor="alipay" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <SiAlipay className="w-5 h-5 text-[#1677FF]" />
                <div>
                  <div className="font-semibold">
                    {locale === 'zh' ? "支付宝" : "Alipay"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {locale === 'zh' ? "使用支付宝扫码支付" : "Scan QR code with Alipay"}
                  </div>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Payment Form */}
      {!loading && clientSecret && (
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
          <CheckoutForm 
            orderDetails={orderDetails}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={handlePaymentMethodChange}
          />
        </Elements>
      )}
    </div>
  );
}
