import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Lock, User } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type AuthResponse = {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
};

type ErrorResponse = {
  error: string;
};

export function AuthForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [loginType, setLoginType] = useState<"email" | "phone">("email");
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Validation errors
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { identifier: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      toast({
        title: t.auth.loginSuccess,
        description: `${t.auth.welcome}, ${data.username}!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("Invalid credentials") 
        ? t.auth.loginFailed 
        : error.message;
      setLoginError(errorMessage);
      toast({
        title: t.auth.loginFailed,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: {
      email?: string;
      phone?: string;
      password: string;
    }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      toast({
        title: t.auth.registerSuccess,
        description: `${t.auth.welcome}, ${data.username}!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      setRegisterError(errorMessage);
      toast({
        title: t.auth.registerFailed,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    setLoginError("");

    // Validation
    if (!loginIdentifier || !loginPassword) {
      setLoginError(t.auth.invalidInput);
      return;
    }

    if (loginPassword.length < 8) {
      setLoginError(t.auth.invalidInput);
      return;
    }

    loginMutation.mutate({
      identifier: loginIdentifier,
      password: loginPassword,
    });
  };

  const handleRegister = () => {
    setRegisterError("");

    // Validation
    if (!registerPassword) {
      setRegisterError(t.auth.invalidInput);
      return;
    }

    if (loginType === "email" && !registerEmail) {
      setRegisterError(t.auth.invalidInput);
      return;
    }

    if (loginType === "phone" && !registerPhone) {
      setRegisterError(t.auth.invalidInput);
      return;
    }

    if (registerPassword.length < 8) {
      setRegisterError(t.auth.invalidInput);
      return;
    }

    registerMutation.mutate({
      email: loginType === "email" ? registerEmail : undefined,
      phone: loginType === "phone" ? registerPhone : undefined,
      password: registerPassword,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t.auth.welcome}</CardTitle>
        <CardDescription>{t.auth.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">
              {t.auth.login}
            </TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register">
              {t.auth.register}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={loginType === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setLoginType("email")}
                data-testid="button-email-login"
              >
                <Mail className="w-4 h-4 mr-2" />
                {t.auth.email}
              </Button>
              <Button
                variant={loginType === "phone" ? "default" : "outline"}
                size="sm"
                onClick={() => setLoginType("phone")}
                data-testid="button-phone-login"
              >
                <Phone className="w-4 h-4 mr-2" />
                {t.auth.phone}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-identifier">
                {loginType === "email" ? t.auth.emailAddress : t.auth.phoneNumber}
              </Label>
              <Input
                id="login-identifier"
                type={loginType === "email" ? "email" : "tel"}
                placeholder={loginType === "email" ? t.auth.emailPlaceholder : t.auth.phonePlaceholder}
                value={loginIdentifier}
                onChange={(e) => {
                  setLoginIdentifier(e.target.value);
                  setLoginError("");
                }}
                data-testid={loginType === "email" ? "input-login-email" : "input-login-phone"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{t.auth.password}</Label>
              <Input
                id="login-password"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setLoginError("");
                }}
                data-testid="input-login-password"
              />
            </div>

            {loginError && (
              <p className="text-sm text-destructive" data-testid="text-login-error">
                {loginError}
              </p>
            )}

            <Button 
              className="w-full" 
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              data-testid="button-submit-login"
            >
              {loginMutation.isPending ? (
                <>{t.common.loading}</>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {t.auth.loginButton}
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={loginType === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setLoginType("email")}
                data-testid="button-email-register"
              >
                <Mail className="w-4 h-4 mr-2" />
                {t.auth.email}
              </Button>
              <Button
                variant={loginType === "phone" ? "default" : "outline"}
                size="sm"
                onClick={() => setLoginType("phone")}
                data-testid="button-phone-register"
              >
                <Phone className="w-4 h-4 mr-2" />
                {t.auth.phone}
              </Button>
            </div>

            {loginType === "email" ? (
              <div className="space-y-2">
                <Label htmlFor="register-email">{t.auth.emailAddress}</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={registerEmail}
                  onChange={(e) => {
                    setRegisterEmail(e.target.value);
                    setRegisterError("");
                  }}
                  data-testid="input-register-email"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="register-phone">{t.auth.phoneNumber}</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder={t.auth.phonePlaceholder}
                  value={registerPhone}
                  onChange={(e) => {
                    setRegisterPhone(e.target.value);
                    setRegisterError("");
                  }}
                  data-testid="input-register-phone"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="register-password">{t.auth.setPassword}</Label>
              <Input
                id="register-password"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={registerPassword}
                onChange={(e) => {
                  setRegisterPassword(e.target.value);
                  setRegisterError("");
                }}
                data-testid="input-register-password"
              />
            </div>

            {registerError && (
              <p className="text-sm text-destructive" data-testid="text-register-error">
                {registerError}
              </p>
            )}

            <Button 
              className="w-full" 
              onClick={handleRegister}
              disabled={registerMutation.isPending}
              data-testid="button-submit-register"
            >
              {registerMutation.isPending ? (
                <>{t.common.loading}</>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {t.auth.registerButton}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
