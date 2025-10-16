import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Lock } from "lucide-react";

export function AuthForm() {
  const [loginType, setLoginType] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log("Login:", { loginType, email, phone, password });
  };

  const handleRegister = () => {
    console.log("Register:", { loginType, email, phone, password });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>欢迎回来</CardTitle>
        <CardDescription>登录或注册开始创作您的音乐</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">登录</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register">注册</TabsTrigger>
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
                邮箱
              </Button>
              <Button
                variant={loginType === "phone" ? "default" : "outline"}
                size="sm"
                onClick={() => setLoginType("phone")}
                data-testid="button-phone-login"
              >
                <Phone className="w-4 h-4 mr-2" />
                手机
              </Button>
            </div>

            {loginType === "email" ? (
              <div className="space-y-2">
                <Label htmlFor="login-email">邮箱地址</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-login-email"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="login-phone">手机号码</Label>
                <Input
                  id="login-phone"
                  type="tel"
                  placeholder="+86 138 0000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="input-login-phone"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-password">密码</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-login-password"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleLogin}
              data-testid="button-submit-login"
            >
              <Lock className="w-4 h-4 mr-2" />
              登录
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
                邮箱
              </Button>
              <Button
                variant={loginType === "phone" ? "default" : "outline"}
                size="sm"
                onClick={() => setLoginType("phone")}
                data-testid="button-phone-register"
              >
                <Phone className="w-4 h-4 mr-2" />
                手机
              </Button>
            </div>

            {loginType === "email" ? (
              <div className="space-y-2">
                <Label htmlFor="register-email">邮箱地址</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-register-email"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="register-phone">手机号码</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="+86 138 0000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="input-register-phone"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="register-password">设置密码</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="至少8个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-register-password"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleRegister}
              data-testid="button-submit-register"
            >
              <Lock className="w-4 h-4 mr-2" />
              注册账号
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
