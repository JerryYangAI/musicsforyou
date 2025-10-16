import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Lock } from "lucide-react";
import { SiStripe, SiWechat } from "react-icons/si";

type PaymentMethod = "stripe" | "wechat";

export function PaymentMethodSelector() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("stripe");

  const handlePayment = () => {
    console.log("Processing payment with:", selectedMethod);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
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
                使用微信扫码支付，快速便捷
              </p>
            </div>
          </div>
        </RadioGroup>

        {/* Price Display */}
        <div className="bg-accent/50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">订单金额</span>
            <span className="text-2xl font-bold">¥29.9</span>
          </div>
          <div className="text-xs text-muted-foreground">包含音乐生成及下载服务</div>
        </div>

        {/* Payment Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handlePayment}
          data-testid="button-confirm-payment"
        >
          <Lock className="w-5 h-5 mr-2" />
          确认支付 ¥29.9
        </Button>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>支付信息经过加密保护</span>
        </div>
      </CardContent>
    </Card>
  );
}
