import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CreditCard, Smartphone, ShieldCheck } from "lucide-react";
import { SiWechat, SiAlipay } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/LanguageProvider";
import { SEO, pageSEO } from "@/components/SEO";

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
  const { t, locale } = useLanguage();
  const seo = pageSEO.payment[locale];
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
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
      <SEO 
        title={seo.title} 
        description={seo.description} 
        locale={locale} 
      />
      <Header />
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            {locale === 'zh' ? '完成支付' : 'Complete Payment'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'zh' 
              ? '选择您的支付方式，完成后我们将立即开始为您生成音乐' 
              : 'Choose your payment method. We will start creating your music immediately after payment'}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Supported Payment Methods */}
          <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-accent/30 rounded-lg">
            <span className="text-sm text-muted-foreground mr-2">
              {locale === 'zh' ? '支持的支付方式：' : 'Supported payment methods:'}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm">{locale === 'zh' ? '信用卡' : 'Card'}</span>
            </div>
            <div className="flex items-center gap-1 text-[#07C160]">
              <SiWechat className="w-5 h-5" />
              <span className="text-sm">{locale === 'zh' ? '微信支付' : 'WeChat Pay'}</span>
            </div>
            <div className="flex items-center gap-1 text-[#1677FF]">
              <SiAlipay className="w-5 h-5" />
              <span className="text-sm">{locale === 'zh' ? '支付宝' : 'Alipay'}</span>
            </div>
          </div>

          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {locale === 'zh' ? '订单摘要' : 'Order Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {locale === 'zh' ? '音乐风格' : 'Music Style'}
                  </span>
                  <span>{orderDetails.musicStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {locale === 'zh' ? '情感氛围' : 'Mood'}
                  </span>
                  <span>{orderDetails.musicMoods.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {locale === 'zh' ? '时长' : 'Duration'}
                  </span>
                  <span>{orderDetails.musicDuration}s</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {locale === 'zh' ? '应付金额' : 'Total'}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      ¥{orderDetails.amount}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'zh' ? '选择支付方式' : 'Choose Payment Method'}
              </CardTitle>
              <CardDescription>
                {locale === 'zh' 
                  ? '支持信用卡、微信支付、支付宝等多种支付方式' 
                  : 'Supports credit card, WeChat Pay, Alipay and more'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StripePaymentForm orderDetails={orderDetails} />
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-3 p-4 bg-accent/20 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {locale === 'zh' ? '安全支付保障' : 'Secure Payment'}
              </span>
              {' · '}
              {locale === 'zh' 
                ? '您的支付信息经过 256 位 SSL 加密保护' 
                : 'Your payment is protected with 256-bit SSL encryption'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
