import { Header } from "@/components/Header";
import { OrderList } from "@/components/OrderList";

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      <div className="container mx-auto px-6 py-12">
        <OrderList />
      </div>
    </div>
  );
}
