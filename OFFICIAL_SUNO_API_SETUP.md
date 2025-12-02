# 官方Suno API集成指南

## 📋 概述

我们已经切换到使用**官方Suno API** (sunoapi.org)，这是一个更稳定、功能更完善的API服务。

## ✅ 优势

- ✅ **官方支持** - 由Suno官方维护，稳定可靠
- ✅ **无需部署** - 直接使用，无需自己搭建服务
- ✅ **完整文档** - 详细的API文档和示例
- ✅ **多种模型** - 支持V3_5, V4, V4_5, V4_5PLUS, V5等模型
- ✅ **商业使用** - 无水印，支持商业使用
- ✅ **高并发** - 支持高并发请求

## 🔑 获取API密钥

1. **访问官网**: https://sunoapi.org
2. **注册账号**: 创建免费账号
3. **获取API密钥**: 
   - 登录后访问 API Key Management Page
   - 创建新的API密钥
   - 复制密钥

## ⚙️ 配置

在 `.env` 文件中添加：

```env
# Suno AI 音乐生成配置（必需）
SUNO_API_KEY=your_suno_api_key_here
SUNO_API_URL=https://api.sunoapi.org
```

## 📚 API端点

### 生成音乐
```
POST https://api.sunoapi.org/api/v1/generate
```

### 查询状态
```
GET https://api.sunoapi.org/api/v1/generate/record-info?taskId=xxx
```

## 🔍 API状态值

官方API使用以下状态值：

- `PENDING` - 等待处理
- `TEXT_SUCCESS` - 歌词生成成功
- `FIRST_SUCCESS` - 第一首生成成功
- `SUCCESS` - 全部生成成功
- `CREATE_TASK_FAILED` - 创建任务失败
- `GENERATE_AUDIO_FAILED` - 生成音频失败
- `CALLBACK_EXCEPTION` - 回调异常
- `SENSITIVE_WORD_ERROR` - 敏感词错误

我们的代码会自动将这些状态映射为：
- `pending` - 等待中
- `processing` - 处理中
- `completed` - 已完成
- `failed` - 失败

## 🎵 支持的模型

- `V3_5` - 基础模型
- `V4` - 改进的人声质量
- `V4_5` - 智能提示理解
- `V4_5PLUS` - 更丰富的音调
- `V4_5ALL` - 更好的歌曲结构
- `V5` - 最新模型（推荐）

当前代码默认使用 `V5` 模型。

## 📝 请求参数

### 自定义模式 (customMode: true)

**带人声** (instrumental: false):
- `prompt` - 歌词/主题提示（必需）
- `style` - 风格描述（必需）
- `title` - 标题（必需）
- `model` - 模型版本
- `vocalGender` - 人声性别 (m/f)

**器乐** (instrumental: true):
- `style` - 风格描述（必需）
- `title` - 标题（必需）

### 非自定义模式 (customMode: false)

- `prompt` - 提示词（必需，最多500字符）

## 🧪 测试

### 1. 测试API连接

```bash
curl -X POST 'https://api.sunoapi.org/api/v1/generate' \
     -H 'Authorization: Bearer YOUR_API_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "prompt": "A happy pop song",
       "customMode": false
     }'
```

### 2. 测试完整流程

1. 配置API密钥到 `.env`
2. 启动服务: `npm run dev`
3. 创建一个测试订单
4. 观察日志，确认：
   - 任务已添加到队列
   - Worker开始处理
   - API调用成功
   - 状态更新正常

## 💰 定价

请访问 https://sunoapi.org 查看最新的定价信息。

## 📖 完整文档

- **官方文档**: https://sunoapiorg.mintlify.app/
- **快速开始**: https://sunoapiorg.mintlify.app/suno-api/quick-start
- **API参考**: https://sunoapiorg.mintlify.app/suno-api/generate-music

## 🆘 支持

- **技术支持**: support@sunoapi.org
- **24/7支持**: 官方提供全天候技术支持
- **API状态**: 监控服务状态

---

**最后更新**: 2025-11-27

