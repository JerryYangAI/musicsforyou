# Suno API 部署指南

## 📋 概述

根据 [SunoAI-API/Suno-API](https://github.com/SunoAI-API/Suno-API) 文档，这是一个**非官方的Suno API服务**，需要先部署才能使用。

## 🔧 部署步骤

### 方案一：Docker部署（推荐）

1. **克隆仓库**
```bash
git clone https://github.com/SunoAI-API/Suno-API.git
cd Suno-API
```

2. **配置环境变量**
```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件，填写以下信息：
# SESSION_ID=your_session_id
# COOKIE=your_cookie_value
```

3. **获取SESSION_ID和COOKIE**

从浏览器中获取：
- 打开 https://suno.com
- 登录您的账号
- 打开开发者工具（F12）
- 在Application/Storage中找到Cookies
- 复制 `session_id` 和 `__session` cookie的值

4. **启动服务**
```bash
docker compose build && docker compose up
```

服务将在 `http://localhost:8000` 启动

### 方案二：Python直接运行

1. **安装依赖**
```bash
pip3 install -r requirements.txt
```

2. **配置环境变量**（同上）

3. **启动服务**
```bash
uvicorn main:app
```

## 📚 API文档

部署后访问：
- Swagger文档: `http://localhost:8000/docs`
- 或: `http://localhost:8000/swagger/index.html`

## 🔍 API端点格式

根据搜索结果，API端点可能是：

### 生成歌曲
```
POST /api/generate
```

请求体：
```json
{
  "prompt": "A popular heavy metal song about war...",
  "make_instrumental": false,
  "model": "chirp-v3-5|chirp-v3-0",
  "wait_audio": true,
  "timeout": 1000
}
```

### 查询状态
```
GET /api/status/:taskId
```

## ⚙️ 配置到我们的项目

在 `.env` 文件中配置：

```env
# Suno API配置（部署后的服务地址）
SUNO_API_URL=http://localhost:8000
# 如果部署在其他服务器，使用实际地址
# SUNO_API_URL=http://your-server:8000

# 注意：这个API使用session_id和cookie认证
# 认证信息在Suno API服务端配置，不需要在这里配置
```

## 🚀 下一步

1. **部署Suno API服务**
2. **访问API文档**确认实际端点格式
3. **调整我们的代码**以适配实际API格式
4. **测试连接**

---

**重要提示**：
- 这个API服务需要保持运行
- 建议使用Docker部署，便于管理
- 如果部署在生产环境，需要配置反向代理和HTTPS

