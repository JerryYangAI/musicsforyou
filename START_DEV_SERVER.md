# 🚀 启动开发服务器指南

## 📋 前置要求

### 1. 检查Node.js版本
确保已安装Node.js（推荐v18或更高版本）：
```bash
node --version
npm --version
```

### 2. 安装依赖
如果还没有安装依赖，请运行：
```bash
npm install
```

### 3. 环境变量配置
确保 `.env` 文件已配置（`.env.example` 提供了示例配置）

---

## 🚀 启动步骤

### 方法一：使用npm脚本（推荐）

```bash
# 1. 进入项目目录
cd /Users/yangguang/Desktop/websiteproject/musicsforyou

# 2. 启动开发服务器
npm run dev
```

### 方法二：直接运行

```bash
# 进入项目目录
cd /Users/yangguang/Desktop/websiteproject/musicsforyou

# 启动开发服务器
NODE_ENV=development tsx server/index.ts
```

---

## ✅ 启动成功的标志

启动成功后，您应该看到类似以下的输出：

```
✓ serving on port 5000
Music generation worker started
```

---

## 🌐 访问网站

启动成功后，在浏览器中访问：

**本地地址**: http://localhost:5000

### 推荐浏览器
- Chrome / Edge（推荐）
- Firefox
- Safari

---

## 📱 查看不同页面

### 主要页面路径：

1. **首页**: http://localhost:5000/
   - 查看新的Hero区域设计
   - 查看Feature区域
   - 查看音乐展示排行榜

2. **音乐定制页面**: http://localhost:5000/create
   - 查看优化的表单设计
   - 测试表单交互效果

3. **订单页面**: http://localhost:5000/orders
   - 查看订单卡片设计
   - 查看进度显示效果

4. **支付页面**: http://localhost:5000/payment
   - 查看支付页面设计
   - 测试支付方式选择

5. **登录/注册**: http://localhost:5000/auth
   - 查看认证页面设计

---

## 🎨 查看UI改进

### 新的设计元素：

1. **Hero区域**
   - 全屏渐变背景
   - 动态音乐波形动画
   - 浮动音乐图标
   - 渐变文字效果

2. **表单设计**
   - 进度条显示
   - 卡片式选择器
   - 渐变按钮

3. **订单卡片**
   - 更大的卡片设计
   - 渐变进度条
   - 优化的状态显示

4. **支付页面**
   - 卡片式支付方式选择
   - 优化的订单摘要
   - 安全提示增强

---

## 🐛 常见问题

### 问题1: 端口被占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::5000
```

**解决方案**：
```bash
# 查找占用端口的进程
lsof -ti:5000

# 杀死进程（替换PID为实际进程ID）
kill -9 PID

# 或者使用其他端口
PORT=5001 npm run dev
```

### 问题2: 依赖未安装

**错误信息**：
```
Cannot find module 'xxx'
```

**解决方案**：
```bash
npm install
```

### 问题3: 环境变量缺失

**错误信息**：
```
Missing required environment variable
```

**解决方案**：
1. 检查 `.env` 文件是否存在
2. 参考 `.env.example` 配置必要的环境变量
3. 至少需要配置：
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `STRIPE_SECRET_KEY`（可选，用于支付功能）
   - `VITE_STRIPE_PUBLIC_KEY`（可选，用于支付功能）

### 问题4: Redis未启动（如果使用音乐生成功能）

**错误信息**：
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**解决方案**：
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# 验证Redis运行
redis-cli ping
# 应该返回: PONG
```

---

## 🔧 开发工具

### 浏览器开发者工具

打开浏览器开发者工具（F12或Cmd+Option+I）可以：
- 查看控制台日志
- 检查网络请求
- 调试CSS样式
- 测试响应式设计

### 热重载

开发服务器支持热重载（HMR），修改代码后页面会自动刷新。

---

## 📝 开发提示

1. **查看控制台**：打开浏览器控制台查看任何错误信息
2. **检查网络**：在Network标签页查看API请求
3. **响应式测试**：使用浏览器开发者工具的设备模拟器测试移动端
4. **清除缓存**：如果样式没有更新，尝试硬刷新（Cmd+Shift+R 或 Ctrl+Shift+R）

---

## 🎯 测试新UI功能

### 1. 测试Hero区域
- 查看渐变背景效果
- 观察动画效果
- 点击CTA按钮

### 2. 测试表单
- 填写音乐定制表单
- 观察进度条变化
- 测试风格和情绪选择

### 3. 测试订单页面
- 查看订单卡片设计
- 测试进度显示（如果有处理中的订单）
- 测试播放和下载功能

### 4. 测试支付页面
- 查看支付方式选择
- 测试支付流程

---

## 🛑 停止服务器

在终端中按 `Ctrl + C` 停止开发服务器。

---

**祝您查看愉快！** 🎉

如有任何问题，请查看项目文档或检查控制台错误信息。

