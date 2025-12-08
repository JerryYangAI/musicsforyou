/**
 * 封面艺术生成模块
 *
 * 使用 OpenAI 图片 API 为歌曲生成高质量专辑封面
 * 
 * 功能特点：
 * - 根据歌曲标题、提示词、标签生成定制化封面
 * - 仅为 Pro/VIP/Admin 用户生成
 * - 支持通过环境变量开关控制
 * - 封面存储到本地 public/covers 目录
 */

import path from "path";
import fs from "fs/promises";
import OpenAI from "openai";
import type { Track } from "./trackStore";
import { getUserById } from "./userStore";

// ============ 配置 ============

// 封面存储目录
const COVERS_DIR = path.join(process.cwd(), "public", "covers");

// 环境变量
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
const ENABLE_OPENAI_COVER = process.env.ENABLE_OPENAI_COVER;

/**
 * 检查模型是否为 DALL-E 系列（支持 response_format 参数）
 */
function isDallEModel(model: string): boolean {
  return model.toLowerCase().startsWith("dall-e");
}

/**
 * 从 URL 下载图片并返回 Buffer
 */
async function downloadImageFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 延迟初始化 OpenAI 客户端
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============ 工具函数 ============

/**
 * 检查封面生成功能是否启用
 */
function isCoverEnabled(): boolean {
  return ENABLE_OPENAI_COVER === "1";
}

/**
 * 检查用户计划是否有资格生成封面
 * 只有 Pro/VIP/Admin 用户可以生成
 */
function shouldGenerateForPlan(plan: string | undefined | null): boolean {
  if (!plan) return false;
  return ["pro", "vip", "admin"].includes(plan);
}

/**
 * 确保封面存储目录存在
 */
async function ensureCoversDir(): Promise<void> {
  try {
    await fs.mkdir(COVERS_DIR, { recursive: true });
  } catch (error) {
    // 目录已存在，忽略错误
  }
}

/**
 * 根据 Track 信息构建图片生成提示词
 */
function buildImagePrompt(track: Track): string {
  const title = track.title || "Untitled Song";
  const basePrompt = track.prompt || "";
  const tags = track.tags || "";
  const modelName = track.modelName || "";

  return (
    `High-quality album cover art for a song titled "${title}". ` +
    `Music description: ${basePrompt}. ` +
    `Tags: ${tags}. Model: ${modelName}. ` +
    `Style: modern, clean, cinematic illustration or stylized artwork. ` +
    `Mood: match the emotional tone of the song. ` +
    `Do not include any text, logos or real people's faces. ` +
    `Square 1:1 composition, suitable for Spotify, Apple Music and online music platforms.`
  );
}

// ============ 主函数 ============

/**
 * 为 Track 生成封面艺术
 *
 * @param track - 要生成封面的 Track
 * @returns 生成的封面 URL，如果跳过或失败则返回 null
 */
export async function generateCoverArtForTrack(track: Track): Promise<string | null> {
  try {
    // 检查环境开关
    if (!isCoverEnabled()) {
      console.log("[CoverArt] ENABLE_OPENAI_COVER !== '1', 跳过封面生成");
      return null;
    }

    // 检查 API Key
    const openai = getOpenAI();
    if (!openai) {
      console.warn("[CoverArt] OPENAI_API_KEY 未配置, 跳过封面生成");
      return null;
    }

    // 检查用户计划
    let userPlan: string | null = null;
    if (track.userId && track.userId !== "guest") {
      try {
        const user = await getUserById(track.userId);
        userPlan = user?.plan ?? null;
      } catch (error) {
        console.warn("[CoverArt] 获取用户信息失败:", error);
      }
    }

    if (!shouldGenerateForPlan(userPlan)) {
      console.log(`[CoverArt] 用户计划 "${userPlan}" 不符合封面生成条件, 跳过`);
      return null;
    }

    // 确保目录存在
    await ensureCoversDir();

    // 构建提示词
    const prompt = buildImagePrompt(track);
    console.log(`[CoverArt] 开始为 Track ${track.id} 生成封面`);
    console.log(`[CoverArt] 使用模型: ${OPENAI_IMAGE_MODEL}`);
    console.log(`[CoverArt] 提示词: ${prompt.substring(0, 100)}...`);

    // 调用 OpenAI 图片 API
    // - dall-e 系列：支持 response_format 参数，使用 b64_json
    // - gpt-image-1 等其他模型：不支持 response_format 参数
    const isDallE = isDallEModel(OPENAI_IMAGE_MODEL);
    
    const generateParams: any = {
      model: OPENAI_IMAGE_MODEL,
      prompt,
      n: 1,
      size: "1024x1024",
    };
    
    // DALL-E 模型需要显式指定 response_format
    if (isDallE) {
      generateParams.response_format = "b64_json";
    }
    
    console.log(`[CoverArt] API 参数: model=${OPENAI_IMAGE_MODEL}, isDallE=${isDallE}`);
    const response = await openai.images.generate(generateParams);

    // 兼容处理返回结果：优先 b64_json，其次 url
    const imageData = response.data[0];
    let buffer: Buffer;
    
    if (imageData?.b64_json) {
      // 方式1：直接从 base64 解码
      console.log("[CoverArt] 使用 b64_json 格式");
      buffer = Buffer.from(imageData.b64_json, "base64");
    } else if (imageData?.url) {
      // 方式2：从 URL 下载图片
      console.log(`[CoverArt] 使用 url 格式，下载: ${imageData.url.substring(0, 50)}...`);
      buffer = await downloadImageFromUrl(imageData.url);
    } else {
      throw new Error("OpenAI 未返回图片数据（b64_json 和 url 都为空）");
    }
    const fileName = `${track.id}.png`;
    const filePath = path.join(COVERS_DIR, fileName);
    await fs.writeFile(filePath, buffer);

    // 返回可访问的 URL
    const publicUrl = `/static/covers/${fileName}`;
    console.log(`[CoverArt] 封面生成成功: ${publicUrl}`);

    return publicUrl;
  } catch (error: any) {
    console.error("[CoverArt] 封面生成失败:", error);
    
    // 提供更详细的错误信息
    if (error.code === "insufficient_quota") {
      console.error("[CoverArt] OpenAI API 额度不足");
    } else if (error.code === "invalid_api_key") {
      console.error("[CoverArt] OpenAI API Key 无效");
    } else if (error.code === "model_not_found") {
      console.error(`[CoverArt] 模型 ${OPENAI_IMAGE_MODEL} 不可用`);
    }

    return null;
  }
}

// ============ 导出 ============

export default {
  generateCoverArtForTrack,
};

