import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Lock } from "lucide-react";
import { SiStripe, SiWechat } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/LanguageProvider";

type PaymentMethod = "stripe" | "wechat";

interface OrderDetails {
  musicStyle: string;
  musicMoods: string[];
  musicDescription: string;
  songTitle?: string;
  voiceType: string;
  musicDuration: number;
  amount: number;
}

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("stripe");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    // Get order details from sessionStorage
    const storedDetails = sessionStorage.getItem("orderDetails");
    if (!storedDetails) {
      toast({
        title: t.common.error,
        description: "未找到订单信息，请重新提交",
        variant: "destructive",
      });
      setLocation("/create");
      return;
    }

    try {
      const details = JSON.parse(storedDetails);
      setOrderDetails(details);
    } catch (error) {
      console.error("Error parsing order details:", error);
      toast({
        title: t.common.error,
        description: "订单信息格式错误",
        variant: "destructive",
      });
      setLocation("/create");
    }
  }, []);

  const handlePaymentMethodSelect = () => {
    if (selectedMethod === "wechat") {
      toast({
        title: "微信支付",
        description: "微信支付功能即将上线，敬请期待！",
      });
      return;
    }

    if (selectedMethod === "stripe") {
      setShowPaymentForm(true);
    }
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">完成支付</h1>
          <p className="text-muted-foreground">
            选择您的支付方式，完成后我们将立即开始为您生成音乐
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {!showPaymentForm ? (
            <Card>
              <CardHeader>
                <CardTitle>选择支付方式</CardTitle>
                <CardDescription>安全可靠的支付保障</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={selectedMethod}
                  onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
                >
                  {/* Stripe Payment */}
                  <div
                    className={`relative flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover-elevate ${
                      selectedMethod === "stripe"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedMethod("stripe")}
                    data-testid="card-payment-stripe"
                  >
                    <RadioGroupItem value="stripe" id="stripe" className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="stripe" className="flex items-center gap-3 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <SiStripe className="w-6 h-6 text-primary" />
                          <span className="font-semibold">国际信用卡</span>
                        </div>
                        <div className="flex gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        支持 Visa、Mastercard、American Express 等国际信用卡
                      </p>
                    </div>
                  </div>

                  {/* WeChat Pay */}
                  <div
                    className={`relative flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover-elevate ${
                      selectedMethod === "wechat"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedMethod("wechat")}
                    data-testid="card-payment-wechat"
                  >
                    <RadioGroupItem value="wechat" id="wechat" className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="wechat" className="flex items-center gap-3 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <SiWechat className="w-6 h-6 text-[#07C160]" />
                          <span className="font-semibold">微信支付</span>
                        </div>
                        <div className="flex gap-2">
                          <Smartphone className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        使用微信扫码支付，快速便捷（即将上线）
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                {/* Price Display */}
                <div className="bg-accent/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">订单金额</span>
                    <span className="text-2xl font-bold">¥{orderDetails.amount}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">包含音乐生成及下载服务</div>
                </div>

                {/* Continue Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePaymentMethodSelect}
                  data-testid="button-continue-payment"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  继续支付 ¥{orderDetails.amount}
                </Button>

                {/* Security Notice */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>支付信息经过加密保护</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>信用卡支付</CardTitle>
                <CardDescription>请填写您的信用卡信息</CardDescription>
              </CardHeader>
              <CardContent>
                <StripePaymentForm orderDetails={orderDetails} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
