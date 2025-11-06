import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Clock, MapPin, MessageSquare } from "lucide-react";
import whatsappQR from "@assets/What's APP QR_1762426755542.png";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("https://formspree.io/f/movpgnbg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      if (response.ok) {
        console.log("Formspree submission successful!");
        toast({
          title: t.common.success,
          description: t.contact.messageSent || "我们已收到您的留言，会尽快回复！",
        });
        setName("");
        setEmail("");
        setMessage("");
      } else {
        console.error("Formspree submission failed with status:", response.status);
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Formspree submission error:", error);
      toast({
        title: t.common.error,
        description: t.contact.messageFailed || "发送失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Clock,
      title: t.contact.businessHours,
      content: t.contact.businessHoursContent,
      type: "text" as const,
    },
    {
      icon: Mail,
      title: t.contact.email,
      content: t.contact.emailAddress,
      type: "text" as const,
    },
    {
      icon: MessageSquare,
      title: t.contact.whatsapp,
      content: t.contact.whatsappInfo,
      type: "qrcode" as const,
    },
    {
      icon: MapPin,
      title: t.contact.address,
      content: t.contact.addressContent,
      type: "text" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4" data-testid="text-contact-title">
                {t.contact.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t.contact.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">{t.contact.getInTouch}</h2>
                {contactInfo.map((info, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <info.icon className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{info.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {info.type === "qrcode" ? (
                        <div className="space-y-3">
                          <CardDescription className="text-base">
                            {info.content}
                          </CardDescription>
                          <div className="flex justify-center">
                            <img 
                              src={whatsappQR} 
                              alt="WhatsApp QR Code" 
                              className="w-48 h-48 rounded-lg border-2 border-primary/20"
                            />
                          </div>
                        </div>
                      ) : (
                        <CardDescription className="text-base">
                          {info.content}
                        </CardDescription>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{t.contact.sendMessage}</CardTitle>
                  <CardDescription>{t.contact.getInTouch}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t.contact.name}</Label>
                      <Input
                        id="name"
                        placeholder={t.contact.namePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.contact.email}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t.contact.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        data-testid="input-contact-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{t.contact.message}</Label>
                      <Textarea
                        id="message"
                        placeholder={t.contact.messagePlaceholder}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        required
                        data-testid="textarea-contact-message"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-send-message">
                      {isSubmitting ? t.common.loading : t.contact.send}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
