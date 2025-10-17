import { Header } from "@/components/Header";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";

export default function PaymentPage() {
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
        <PaymentMethodSelector />
      </div>
    </div>
  );
}
