# 数据库配置指南

## 📋 概述

项目使用 **PostgreSQL** 数据库，推荐使用 **Neon Database**（免费、serverless）。

## 🚀 快速设置（推荐：Neon Database）

### 步骤1: 创建Neon数据库

1. 访问 https://neon.tech
2. 注册/登录账号（支持GitHub登录）
3. 点击 "Create Project"
4. 填写项目信息：
   - Project name: `musicsforyou`（或您喜欢的名称）
   - Region: 选择离您最近的区域
   - PostgreSQL version: 15 或 16（推荐）
5. 点击 "Create Project"

### 步骤2: 获取连接字符串

1. 在项目页面，点击 "Connection Details"
2. 选择 "Connection string" 标签
3. 复制连接字符串，格式类似：
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 步骤3: 配置到项目

在 `.env` 文件中，将连接字符串填入：

```env
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## 🔧 其他数据库选项

### 选项1: 本地PostgreSQL

如果您有本地PostgreSQL：

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/musicsforyou
```

### 选项2: Supabase

1. 访问 https://supabase.com
2. 创建项目
3. 在 Settings → Database 中获取连接字符串

### 选项3: Railway

1. 访问 https://railway.app
2. 创建PostgreSQL数据库
3. 获取连接字符串

## ✅ 验证配置

配置完成后，运行：

```bash
npm run db:push
```

这将创建所有必需的表。

## 🆘 常见问题

### 问题1: 连接超时

**解决方案**:
- 检查网络连接
- 确认数据库服务正在运行
- 检查防火墙设置

### 问题2: 认证失败

**解决方案**:
- 检查用户名和密码是否正确
- 确认数据库允许您的IP连接
- 检查SSL模式设置

### 问题3: 数据库不存在

**解决方案**:
- 在数据库管理界面创建数据库
- 或使用连接字符串中指定的数据库名

---

**推荐**: 使用 Neon Database，免费且易于设置！

