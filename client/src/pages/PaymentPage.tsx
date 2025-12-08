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

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Supported Payment Methods Banner */}
          <div className="glass p-6 rounded-xl border-2 border-primary/20">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <span className="text-sm font-semibold text-muted-foreground">
                {locale === 'zh' ? '支持的支付方式：' : 'Supported payment methods:'}
              </span>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{locale === 'zh' ? '信用卡' : 'Card'}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-[#07C160]/30">
                <SiWechat className="w-5 h-5 text-[#07C160]" />
                <span className="text-sm font-medium">{locale === 'zh' ? '微信支付' : 'WeChat Pay'}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-[#1677FF]/30">
                <SiAlipay className="w-5 h-5 text-[#1677FF]" />
                <span className="text-sm font-medium">{locale === 'zh' ? '支付宝' : 'Alipay'}</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-xl flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                {locale === 'zh' ? '订单摘要' : 'Order Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      {locale === 'zh' ? '音乐风格' : 'Music Style'}
                    </p>
                    <p className="font-semibold">{orderDetails.musicStyle}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      {locale === 'zh' ? '时长' : 'Duration'}
                    </p>
                    <p className="font-semibold">{orderDetails.musicDuration}s</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">
                    {locale === 'zh' ? '情感氛围' : 'Mood'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {orderDetails.musicMoods.map((mood) => (
                      <span key={mood} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {mood}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center p-4 rounded-lg gradient-primary/10">
                    <span className="text-lg font-semibold">
                      {locale === 'zh' ? '应付金额' : 'Total'}
                    </span>
                    <span className="text-3xl font-bold gradient-text">
                      ¥{orderDetails.amount}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-xl flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                {locale === 'zh' ? '选择支付方式' : 'Choose Payment Method'}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {locale === 'zh' 
                  ? '支持信用卡、微信支付、支付宝等多种支付方式' 
                  : 'Supports credit card, WeChat Pay, Alipay and more'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <StripePaymentForm orderDetails={orderDetails} />
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-3 p-6 glass rounded-xl border-2 border-green-500/20">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-foreground block">
                {locale === 'zh' ? '安全支付保障' : 'Secure Payment'}
              </span>
              <span className="text-muted-foreground">
                {locale === 'zh' 
                  ? '您的支付信息经过 256 位 SSL 加密保护' 
                  : 'Your payment is protected with 256-bit SSL encryption'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
