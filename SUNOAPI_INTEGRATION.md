# Suno API 集成文档

本文档说明如何使用已集成的 SunoAPI.org 音乐生成功能。

## 📋 环境变量配置

在 `.env` 文件中添加以下环境变量：

```env
# Suno API 配置 (SunoAPI.org)
SUNOAPI_BASE=https://api.sunoapi.org/api/v1
SUNOAPI_KEY=your_api_key_here

# 回调地址配置（可选，开发环境可不配置）
# 生产环境必须设置为公网可访问的 HTTPS 地址
SUNOAPI_CALLBACK_URL=https://your-domain.com/api/music/webhook
```

| 变量名 | 说明 | 必填 | 示例值 |
|--------|------|------|--------|
| `SUNOAPI_BASE` | API 基础地址 | ✅ | `https://api.sunoapi.org/api/v1` |
| `SUNOAPI_KEY` | API 密钥（从 SunoAPI.org 获取） | ✅ | `sk-xxxxx` |
| `SUNOAPI_CALLBACK_URL` | 回调地址（见下方说明） | ❌ | `https://your-domain.com/api/music/webhook` |

---

## 📖 API 接口文档

### 1. POST /api/music/generate

提交生成歌曲任务。

#### 请求

```http
POST /api/music/generate
Content-Type: application/json
```

**请求体（简单模式 - 推荐）：**

```json
{
  "prompt": "一首关于夏天的流行歌曲，旋律轻快，充满阳光气息",
  "title": "夏日旋律",
  "instrumental": false
}
```

**请求体（自定义模式）：**

```json
{
  "prompt": "歌词内容或主题描述",
  "title": "歌曲标题",
  "customMode": true,
  "style": "pop, upbeat, summer vibes",
  "instrumental": false,
  "model": "V5"
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `prompt` | string | ✅ | - | 生成音乐的文案提示词（非自定义模式下作为歌曲描述） |
| `title` | string | ❌ | `""` | 歌曲标题 |
| `customMode` | boolean | ❌ | `false` | 是否启用自定义模式（见下方说明） |
| `instrumental` | boolean | ❌ | `false` | 是否纯伴奏（无人声） |
| `model` | string | ❌ | `"V5"` | 模型版本（见下方说明） |
| `mv` | string | ❌ | - | **已废弃**，兼容旧版，会自动映射到 `model` |
| `style` | string | ❌ | - | 自定义模式下的音乐风格标签 |
| `lyrics` | string | ❌ | - | 自定义模式下的歌词内容 |

---

### 关于 model 参数

#### 支持的模型版本

SunoAPI 支持以下模型版本：

| 值 | 说明 |
|----|------|
| `V3_5` | Suno V3.5 模型 |
| `V4` | Suno V4 模型 |
| `V4_5` | Suno V4.5 模型 |
| `V4_5ALL` | Suno V4.5 ALL 模型 |
| `V4_5PLUS` | Suno V4.5 Plus 模型 |
| `V5` | Suno V5 模型（**推荐，默认值**） |

#### 当前项目的默认行为

- **未指定 `model` 时，默认使用 `V5`**（最新模型）
- 如果传入无效的模型值，系统会打印警告并自动使用默认值 `V5`

#### 兼容旧的 mv 字段

如果你之前使用的是 `mv` 字段（如 `"chirp-v3-5"`），系统会自动映射到对应的 `model` 值：

| 旧的 mv 值 | 映射到 model |
|------------|--------------|
| `chirp-v3-5` / `chirp-v3.5` | `V3_5` |
| `chirp-v4` | `V4` |
| `chirp-v4-5` / `chirp-v4.5` | `V4_5` |
| `chirp-v5` / `chirp-v5-v2` | `V5` |

> ⚠️ **建议**：新代码请直接使用 `model` 字段，`mv` 字段仅为向后兼容保留。

#### 前端切换模型示例

```javascript
// 使用 V5 模型（默认）
await generateMusic({
  prompt: "一首轻快的流行歌曲",
  title: "快乐时光",
});

// 使用 V4.5 Plus 模型
await generateMusic({
  prompt: "一首轻快的流行歌曲",
  title: "快乐时光",
  model: "V4_5PLUS",
});

// 使用 V3.5 模型
await generateMusic({
  prompt: "一首轻快的流行歌曲",
  title: "快乐时光",
  model: "V3_5",
});
```

---

### 关于 customMode 参数

#### 什么是 customMode？

`customMode` 控制 Suno API 的生成模式：

| 值 | 模式 | 说明 |
|----|------|------|
| `false` | **简单模式（默认）** | 只需提供 `prompt` 描述，AI 自动生成歌词和编曲 |
| `true` | **自定义模式** | 可以精细控制 `style`（风格标签）和 `lyrics`（歌词内容） |

#### 当前项目的默认行为

- **未指定 `customMode` 时，默认为 `false`**（简单模式）
- 简单模式更适合快速生成，只需要描述想要的歌曲风格和内容
- 自定义模式适合需要精细控制歌词和风格的场景

#### 示例对比

**简单模式（customMode: false）：**

```json
{
  "prompt": "一首浪漫的情歌，讲述初恋的故事，旋律温柔甜蜜",
  "title": "初恋的味道"
}
```

AI 会根据 prompt 自动生成合适的歌词和编曲。

**自定义模式（customMode: true）：**

```json
{
  "prompt": "初恋回忆",
  "title": "初恋的味道",
  "customMode": true,
  "style": "pop ballad, romantic, acoustic guitar",
  "lyrics": "[Verse 1]\n那年夏天的风\n轻轻吹过你的脸\n..."
}
```

可以完全控制歌词内容和风格标签。

---

### 关于 callBackUrl 参数

#### 什么是 callBackUrl？

SunoAPI 要求每次生成请求必须提供一个 `callBackUrl`（回调地址）。当音乐生成完成后，SunoAPI 会向此地址发送 POST 请求，通知生成结果。

#### 当前项目的回调地址配置

回调地址的优先级：

1. **请求参数** `params.callBackUrl`（最高优先级）
2. **环境变量** `SUNOAPI_CALLBACK_URL`
3. **默认值** `http://localhost:5000/api/music/webhook`（开发环境）

#### 开发环境

在本地开发时，**不需要配置** `SUNOAPI_CALLBACK_URL`，系统会自动使用默认值：

```
http://localhost:5000/api/music/webhook
```

> ⚠️ **注意**：由于 localhost 不是公网地址，SunoAPI 实际上无法回调到你的本地服务器。这种情况下，你需要使用轮询方式（`GET /api/music/result`）来获取生成结果。

#### 生产环境配置

部署到生产环境时，**必须配置** `SUNOAPI_CALLBACK_URL` 为公网可访问的 HTTPS 地址：

```env
# .env (生产环境)
SUNOAPI_CALLBACK_URL=https://your-domain.com/api/music/webhook
```

配置要求：
- ✅ 必须是 **HTTPS** 地址
- ✅ 必须是 **公网可访问** 的地址
- ✅ 端口必须是 **443**（标准 HTTPS 端口）

示例：
```
✅ https://musicsforyou.com/api/music/webhook
✅ https://api.musicsforyou.com/api/music/webhook
❌ http://musicsforyou.com/api/music/webhook  （必须是 HTTPS）
❌ https://musicsforyou.com:8080/api/music/webhook  （端口必须是 443）
❌ http://localhost:5000/api/music/webhook  （不是公网地址）
```

---

### 3. POST /api/music/webhook

SunoAPI 回调端点，用于接收生成完成的通知。

#### 请求（由 SunoAPI 发起）

```http
POST /api/music/webhook
Content-Type: application/json
```

#### 响应

```json
{
  "success": true,
  "message": "Webhook received",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

> 当前实现仅打印收到的回调数据用于调试。后续可扩展为：
> - 更新订单状态
> - 保存生成的音乐文件到本地存储
> - 发送通知给用户

#### 响应

**成功：**

```json
{
  "success": true,
  "taskId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "raw": { ... }
}
```

**失败：**

```json
{
  "success": false,
  "error": "错误信息"
}
```

---

### 2. GET /api/music/result

根据 taskId 查询生成结果。

#### 请求

```http
GET /api/music/result?taskId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `taskId` | string | ✅ | 任务 ID |

#### 响应

**成功（生成完成）：**

```json
{
  "success": true,
  "status": "finished",
  "audioUrl": "https://cdn.suno.ai/xxx.mp3",
  "sourceAudioUrl": "https://cdn.suno.ai/source/xxx.mp3",
  "imageUrl": "https://cdn.suno.ai/xxx.png",
  "sourceImageUrl": "https://cdn.suno.ai/source/xxx.png",
  "videoUrl": "https://cdn.suno.ai/xxx.mp4",
  "sourceVideoUrl": null,
  "title": "夏日旋律",
  "prompt": "一首关于夏天的流行歌曲",
  "duration": 180,
  "tags": "pop, summer, upbeat",
  "modelName": "V5",
  "raw": { ... }
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 请求是否成功 |
| `status` | string | 任务状态（见下方状态映射） |
| `audioUrl` | string \| null | 主要音频 URL |
| `sourceAudioUrl` | string \| null | 源音频 URL（备选） |
| `imageUrl` | string \| null | 封面图片 URL |
| `sourceImageUrl` | string \| null | 源图片 URL（备选） |
| `videoUrl` | string \| null | 视频 URL |
| `sourceVideoUrl` | string \| null | 源视频 URL（备选） |
| `title` | string \| null | 歌曲标题 |
| `prompt` | string \| null | 生成提示词 |
| `duration` | number \| null | 时长（秒） |
| `tags` | string \| null | 风格标签 |
| `modelName` | string \| null | 使用的模型 |
| `raw` | object | SunoAPI 原始响应数据 |

#### 状态映射逻辑

| 顶层 status | 条件 | 说明 |
|-------------|------|------|
| `finished` | `sunoData` 中存在非空 `audioUrl` | **优先判断**：只要有音频可用就视为完成 |
| `pending` | 原始状态为 `PENDING` | 任务等待中 |
| `generating` | 原始状态为 `TEXT_SUCCESS` 或 `FIRST_SUCCESS`（但无音频） | 正在生成 |
| `failed` | 原始状态为错误状态 | 生成失败 |

> ⚠️ **重要**：当 `status` 为 `"finished"` 时，`audioUrl` 一定有值。如果需要备选 URL，可使用 `sourceAudioUrl`。

#### SunoAPI 原始状态说明

| 原始状态 | 说明 |
|----------|------|
| `PENDING` | 任务已创建，等待处理 |
| `TEXT_SUCCESS` | 文本/歌词生成成功 |
| `FIRST_SUCCESS` | 第一首歌曲生成成功（可能已有音频） |
| `SUCCESS` | 全部生成完成 |
| `CREATE_TASK_FAILED` | 任务创建失败 |
| `GENERATE_AUDIO_FAILED` | 音频生成失败 |
| `CALLBACK_EXCEPTION` | 回调异常 |
| `SENSITIVE_WORD_ERROR` | 敏感词错误 |

**失败：**

```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 🧪 测试示例

### 使用 cURL

**1. 生成歌曲：**

```bash
curl -X POST http://localhost:5000/api/music/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一首关于夏天的流行歌曲，旋律轻快，歌词描述海边的美好时光",
    "title": "夏日海风",
    "instrumental": false
  }'
```

**2. 查询结果：**

```bash
curl "http://localhost:5000/api/music/result?taskId=YOUR_TASK_ID"
```

### 使用 HTTPie

**1. 生成歌曲：**

```bash
http POST localhost:5000/api/music/generate \
  prompt="一首关于夏天的流行歌曲" \
  title="夏日旋律" \
  instrumental:=false
```

**2. 查询结果：**

```bash
http GET localhost:5000/api/music/result taskId==YOUR_TASK_ID
```

---

## 💻 前端调用示例

### 使用 React Hook

```tsx
import { useSunoMusic } from "@/hooks/use-suno-music";

function MusicGenerator() {
  const {
    isGenerating,
    isPolling,
    status,
    audioUrl,
    imageUrl,
    error,
    generateMusic,
    startPolling,
    stopPolling,
    reset,
  } = useSunoMusic();

  const handleGenerate = async () => {
    const taskId = await generateMusic({
      prompt: "一首关于夏天的流行歌曲",
      title: "夏日旋律",
    });

    if (taskId) {
      // 开始轮询，每 3 秒检查一次，最多 100 次
      startPolling(taskId, 3000, 100);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating || isPolling}>
        {isGenerating ? "提交中..." : isPolling ? "生成中..." : "生成音乐"}
      </button>

      {status && <p>状态: {status}</p>}
      {error && <p style={{ color: "red" }}>错误: {error}</p>}

      {audioUrl && (
        <audio controls src={audioUrl}>
          Your browser does not support the audio element.
        </audio>
      )}

      {imageUrl && <img src={imageUrl} alt="Album cover" />}
    </div>
  );
}
```

### 使用原生 fetch

```javascript
// 1. 提交生成任务
async function generateMusic() {
  const response = await fetch("/api/music/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "一首关于夏天的流行歌曲",
      title: "夏日旋律",
    }),
  });
  const data = await response.json();

  if (data.success) {
    console.log("任务已提交，taskId:", data.taskId);
    return data.taskId;
  } else {
    console.error("提交失败:", data.error);
    return null;
  }
}

// 2. 轮询查询结果
async function pollResult(taskId) {
  const maxAttempts = 100;
  const interval = 3000; // 3秒

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/music/result?taskId=${taskId}`);
    const data = await response.json();

    if (data.success) {
      console.log("当前状态:", data.status);

      if (data.status === "finished") {
        console.log("生成完成！");
        console.log("音频URL:", data.audioUrl);
        return data;
      }

      if (data.status === "failed") {
        console.error("生成失败");
        return data;
      }
    }

    // 等待后继续轮询
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  console.error("轮询超时");
  return null;
}

// 使用示例
(async () => {
  const taskId = await generateMusic();
  if (taskId) {
    const result = await pollResult(taskId);
    console.log("最终结果:", result);
  }
})();
```

---

## 📁 文件结构

```
server/
├── sunoApiClient.ts    # Suno API 客户端封装
├── routes.ts           # API 路由（包含 /api/music/generate 和 /api/music/result）
└── ...

client/src/hooks/
├── use-suno-music.ts   # React Hook 封装
└── ...
```

---

## ⚠️ 注意事项

1. **API Key 安全**：`SUNOAPI_KEY` 只在服务器端使用，不会暴露到前端。

2. **轮询间隔**：建议轮询间隔 3-5 秒，避免请求过于频繁。

3. **超时处理**：音乐生成通常需要 30 秒到 2 分钟，请设置足够的轮询次数。

4. **错误处理**：生成失败时，`status` 会变为 `failed`，请检查 `raw` 字段获取详细错误信息。

---

## 🔗 相关链接

- [SunoAPI.org 官方文档](https://sunoapi.org)
- [Suno AI 官网](https://suno.com)

