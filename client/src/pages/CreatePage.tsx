import { Header } from "@/components/Header";
import { MusicCustomizationForm } from "@/components/MusicCustomizationForm";

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      <div className="container mx-auto px-6 py-12">
        <MusicCustomizationForm />
      </div>
    </div>
  );
}
