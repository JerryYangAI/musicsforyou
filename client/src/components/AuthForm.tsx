import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, User, Phone, Mail, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

// ============ 类型定义 ============

type AuthMethod = "phone" | "email";

// ============ 主组件 ============

export function AuthForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  
  // 当前认证方式（手机号/邮箱）
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  
  // 登录表单状态
  const [loginPhone, setLoginPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // 注册表单状态
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerDisplayName, setRegisterDisplayName] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // 中国手机号校验
  const isValidChinaPhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone);
  
  // 邮箱校验
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 登录处理
  const handleLogin = async () => {
    setLoginError("");

    // 校验
    if (authMethod === "phone") {
      if (!loginPhone || !isValidChinaPhone(loginPhone)) {
        setLoginError("请输入有效的中国手机号");
        return;
      }
    } else {
      if (!loginEmail || !isValidEmail(loginEmail)) {
        setLoginError("请输入有效的邮箱地址");
        return;
      }
    }

    if (!loginPassword || loginPassword.length < 6) {
      setLoginError("密码至少 6 位");
      return;
    }

    setIsLoggingIn(true);
    try {
      const user = await login({
        method: authMethod,
        phone: authMethod === "phone" ? loginPhone : undefined,
        email: authMethod === "email" ? loginEmail : undefined,
        password: loginPassword,
      });

      toast({
        title: "登录成功",
        description: `欢迎回来，${user.displayName}！`,
      });

      setLocation("/suno-demo");
    } catch (error: any) {
      setLoginError(error.message || "登录失败");
      toast({
        title: "登录失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 注册处理
  const handleRegister = async () => {
    setRegisterError("");

    // 校验
    if (authMethod === "phone") {
      if (!registerPhone || !isValidChinaPhone(registerPhone)) {
        setRegisterError("请输入有效的中国手机号");
        return;
      }
    } else {
      if (!registerEmail || !isValidEmail(registerEmail)) {
        setRegisterError("请输入有效的邮箱地址");
        return;
      }
    }

    if (!registerPassword || registerPassword.length < 6) {
      setRegisterError("密码至少 6 位");
      return;
    }

    if (!registerDisplayName || registerDisplayName.trim().length === 0) {
      setRegisterError("请输入昵称");
      return;
    }

    setIsRegistering(true);
    try {
      const user = await register({
        method: authMethod,
        phone: authMethod === "phone" ? registerPhone : undefined,
        email: authMethod === "email" ? registerEmail : undefined,
        password: registerPassword,
        displayName: registerDisplayName.trim(),
      });

      toast({
        title: "注册成功",
        description: `欢迎，${user.displayName}！你已获得每月 3 次免费生成额度。`,
      });

      setLocation("/suno-demo");
    } catch (error: any) {
      setRegisterError(error.message || "注册失败");
      toast({
        title: "注册失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t.auth?.welcome || "欢迎使用"}</CardTitle>
        <CardDescription>
          {t.auth?.subtitle || "注册后可获得每月 3 首免费生成额度，支持下载"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 认证方式切换 */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            variant={authMethod === "phone" ? "default" : "outline"}
            size="sm"
            onClick={() => setAuthMethod("phone")}
            className="gap-2"
          >
            <Phone className="w-4 h-4" />
            手机号
          </Button>
          <Button
            variant={authMethod === "email" ? "default" : "outline"}
            size="sm"
            onClick={() => setAuthMethod("email")}
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            邮箱
          </Button>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">
              {t.auth?.login || "登录"}
            </TabsTrigger>
            <TabsTrigger value="register">
              {t.auth?.register || "注册"}
            </TabsTrigger>
          </TabsList>
          
          {/* 登录表单 */}
          <TabsContent value="login" className="space-y-4 mt-4">
            {authMethod === "phone" ? (
              <div className="space-y-2">
                <Label htmlFor="login-phone">手机号</Label>
                <Input
                  id="login-phone"
                  type="tel"
                  placeholder="请输入中国手机号"
                  value={loginPhone}
                  onChange={(e) => {
                    setLoginPhone(e.target.value);
                    setLoginError("");
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="login-email">邮箱</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setLoginError("");
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-password">{t.auth?.password || "密码"}</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="请输入密码"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setLoginError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {loginError && (
              <p className="text-sm text-destructive">{loginError}</p>
            )}

            <Button 
              className="w-full" 
              onClick={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {t.auth?.loginButton || "登录"}
                </>
              )}
            </Button>
          </TabsContent>

          {/* 注册表单 */}
          <TabsContent value="register" className="space-y-4 mt-4">
            {authMethod === "phone" ? (
              <div className="space-y-2">
                <Label htmlFor="register-phone">手机号</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="请输入中国手机号"
                  value={registerPhone}
                  onChange={(e) => {
                    setRegisterPhone(e.target.value);
                    setRegisterError("");
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="register-email">邮箱</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  value={registerEmail}
                  onChange={(e) => {
                    setRegisterEmail(e.target.value);
                    setRegisterError("");
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="register-displayName">昵称</Label>
              <Input
                id="register-displayName"
                type="text"
                placeholder="请输入昵称"
                value={registerDisplayName}
                onChange={(e) => {
                  setRegisterDisplayName(e.target.value);
                  setRegisterError("");
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">设置密码</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="至少 6 位密码"
                value={registerPassword}
                onChange={(e) => {
                  setRegisterPassword(e.target.value);
                  setRegisterError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>

            {registerError && (
              <p className="text-sm text-destructive">{registerError}</p>
            )}

            <Button 
              className="w-full" 
              onClick={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  注册中...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  {t.auth?.registerButton || "注册"}
                </>
              )}
            </Button>

            {/* 注册提示 */}
            <p className="text-xs text-muted-foreground text-center">
              注册即可获得每月 3 首免费生成额度，并支持下载作品
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
