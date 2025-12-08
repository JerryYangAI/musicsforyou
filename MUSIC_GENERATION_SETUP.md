# 音乐生成功能 - 配置与部署指南

## 📋 前置要求

### 1. Suno AI API 密钥

您需要：
1. 访问 [Suno API 文档](https://docs.sunoapi.org/) 获取API密钥
2. 在 `.env` 文件中配置 `SUNO_API_KEY`

**获取API密钥步骤**：
- 访问 Suno API 管理页面
- 创建新的API密钥
- 复制密钥到环境变量

### 2. Redis 服务器

音乐生成使用 Redis 作为任务队列，您需要：

**选项A：本地Redis（开发环境）**
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis

# 验证Redis运行
redis-cli ping
# 应该返回: PONG
```

**选项B：云Redis服务（生产环境）**
- Redis Cloud
- AWS ElastiCache
- Google Cloud Memorystore
- Upstash Redis

## 🔧 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# Suno AI 音乐生成配置（必需）
SUNO_API_KEY=your_suno_api_key_here
SUNO_API_URL=https://api.sunoapi.org

# Redis 配置（必需）
REDIS_URL=redis://localhost:6379
# 如果Redis需要密码，取消下面的注释
# REDIS_PASSWORD=your_redis_password

# 任务队列配置（可选）
QUEUE_CONCURRENCY=5        # 并发处理任务数
QUEUE_MAX_RETRIES=3        # 最大重试次数
```

## 🗄️ 数据库迁移

运行数据库迁移以创建 `music_generation_tasks` 表：

```bash
npm run db:push
```

这将创建以下表结构：
- `music_generation_tasks` - 存储音乐生成任务信息

## 🚀 启动服务

### 开发环境

```bash
npm run dev
```

这将同时启动：
- Express API 服务器
- Vite 开发服务器
- 音乐生成 Worker 进程

### 生产环境

```bash
npm run build
npm start
```

## 📝 功能说明

### 自动音乐生成流程

1. **用户支付成功** → 创建订单（状态：`processing`）
2. **自动触发** → 将音乐生成任务添加到队列
3. **Worker处理** → 调用Suno API生成音乐
4. **进度跟踪** → 轮询生成进度（每2秒）
5. **文件下载** → 生成完成后下载音频文件
6. **文件上传** → 上传到对象存储
7. **订单完成** → 更新订单状态为 `completed`

### API端点

#### 获取生成状态
```
GET /api/music/generation/:orderId/status
```

响应：
```json
{
  "orderId": "order-id",
  "status": "processing",
  "progress": 45,
  "audioUrl": "https://...",
  "errorMessage": null
}
```

#### 重试失败的生成（管理员）
```
POST /api/music/generation/:orderId/retry
```

## 🧪 测试

### 1. 测试Redis连接

```bash
redis-cli ping
# 应该返回: PONG
```

### 2. 测试Suno API

创建一个测试脚本 `test-suno.js`：

```javascript
import { musicGenerationService } from './server/musicGenerationService.js';

async function test() {
  try {
    const result = await musicGenerationService.generateMusic({
      description: "A happy pop song about summer",
      style: "pop",
      moods: ["happy"],
      duration: 60,
    });
    console.log("Generation started:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
```

运行：
```bash
node test-suno.js
```

### 3. 测试完整流程

1. 创建一个测试订单（支付状态为 `paid`）
2. 检查订单状态是否变为 `processing`
3. 检查Redis队列中是否有任务
4. 观察Worker日志
5. 等待生成完成
6. 验证订单状态变为 `completed`
7. 验证音乐文件URL已更新

## 🐛 故障排除

### 问题1: Redis连接失败

**错误信息**：
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**解决方案**：
- 确认Redis服务正在运行：`redis-cli ping`
- 检查 `REDIS_URL` 环境变量是否正确
- 如果使用远程Redis，检查网络连接和防火墙设置

### 问题2: Suno API密钥错误

**错误信息**：
```
Suno API error: Invalid API key
```

**解决方案**：
- 检查 `SUNO_API_KEY` 环境变量是否正确设置
- 确认API密钥有效且未过期
- 检查API密钥权限

### 问题3: Worker未启动

**检查方法**：
- 查看服务器启动日志，应该看到：`Music generation worker started`
- 如果没有，检查错误日志

**解决方案**：
- 确认Redis连接正常
- 检查依赖包是否已安装：`npm install`
- 查看详细错误日志

### 问题4: 任务队列不工作

**检查方法**：
```bash
# 连接到Redis
redis-cli

# 查看队列
KEYS bull:music-generation:*
```

**解决方案**：
- 确认Worker进程正在运行
- 检查队列配置是否正确
- 查看Worker日志中的错误信息

### 问题5: 文件上传失败

**错误信息**：
```
Failed to upload audio to object storage
```

**解决方案**：
- 检查对象存储配置
- 确认上传URL有效
- 检查文件大小限制
- 查看对象存储服务日志

## 📊 监控和日志

### 查看Worker日志

Worker会在控制台输出详细的日志：
- `[Worker] Processing music generation for order ...`
- `[Worker] Music generation started, taskId: ...`
- `[Worker] Order ... progress: X%`
- `[Worker] Music generation completed for order ...`

### 监控队列状态

可以使用 BullMQ Dashboard 或 Redis CLI 监控队列：

```bash
# 查看队列中的任务数
redis-cli LLEN bull:music-generation:wait

# 查看正在处理的任务
redis-cli LLEN bull:music-generation:active

# 查看已完成的任务
redis-cli LLEN bull:music-generation:completed
```

## 🔒 安全注意事项

1. **API密钥安全**
   - 永远不要将API密钥提交到代码仓库
   - 使用环境变量存储敏感信息
   - 定期轮换API密钥

2. **Redis安全**
   - 生产环境使用密码保护
   - 限制Redis访问IP
   - 使用TLS连接（如果支持）

3. **文件访问控制**
   - 确保对象存储的ACL配置正确
   - 验证文件访问权限

## 📚 相关文档

- [Suno API 文档](https://docs.sunoapi.org/)
- [BullMQ 文档](https://docs.bullmq.io/)
- [Redis 文档](https://redis.io/docs/)

## 🆘 获取帮助

如果遇到问题：
1. 查看本文档的故障排除部分
2. 检查服务器日志
3. 查看相关服务的文档
4. 联系技术支持

---

**最后更新**: 2025-11-27


