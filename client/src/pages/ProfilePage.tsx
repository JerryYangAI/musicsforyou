import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SEO, pageSEO } from "@/components/SEO";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { t, locale } = useLanguage();
  const seo = pageSEO.profile[locale];
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.profile.passwordUpdated,
        description: t.common.success,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setError("");
    },
    onError: (error: Error) => {
      let errorMessage = t.profile.passwordUpdateFailed;
      
      if (error.message.includes("Incorrect password")) {
        errorMessage = t.profile.incorrectPassword;
      } else if (error.message.includes("must be different from current password")) {
        errorMessage = t.profile.samePasswordError;
      }
      
      setError(errorMessage);
      toast({
        title: t.profile.passwordUpdateFailed,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleChangePassword = () => {
    setError("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError(t.profile.passwordRequired);
      return;
    }

    if (newPassword.length < 8) {
      setError(t.auth.invalidInput);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError(t.profile.newPasswordMismatch);
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
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
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">{t.profile.title}</h1>
          </div>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.accountInfo}</CardTitle>
              <CardDescription>{t.profile.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium" data-testid="text-username">{user.username}</span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t.profile.changePassword}
              </CardTitle>
              <CardDescription>
                {t.profile.newPasswordPlaceholder}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t.profile.currentPassword}</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder={t.profile.currentPasswordPlaceholder}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setError("");
                  }}
                  data-testid="input-current-password"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="new-password">{t.profile.newPassword}</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder={t.profile.newPasswordPlaceholder}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  data-testid="input-new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">{t.profile.confirmNewPassword}</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder={t.profile.confirmNewPasswordPlaceholder}
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setError("");
                  }}
                  data-testid="input-confirm-new-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" data-testid="text-password-error">
                  {error}
                </p>
              )}

              <Button
                className="w-full"
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                data-testid="button-update-password"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.common.loading}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    {t.profile.updatePassword}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
