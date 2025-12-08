/**
 * Prompt 优化模块
 *
 * 使用 OpenAI GPT 帮助用户润色音乐生成的提示词
 */

import OpenAI from "openai";

// ============ 配置 ============

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

// 延迟初始化 OpenAI 客户端
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============ 类型定义 ============

export interface OptimizePromptOptions {
  rawPrompt: string;
  language?: "zh" | "en";
  title?: string;
  stylePresetId?: string | null;
}

// ============ System Prompts ============

const SYSTEM_PROMPT_ZH = `
你是一个为 AI 音乐生成写提示词的助手。
请用自然、清晰的中文来改写和丰富用户给你的简短描述。
输出内容要紧凑但信息密度高，适合作为提示词直接输入音乐生成模型。
只输出提示词本身，不要有任何额外的解释、标题或前缀。
`.trim();

const SYSTEM_PROMPT_EN = `
You are an assistant that writes prompts for AI music generation.
Please rewrite and enrich the user's short description into a clear, detailed English prompt.
Output should be 2-5 concise sentences suitable for direct input to a music generation model.
Only output the prompt itself, without any extra explanations, titles, or prefixes.
`.trim();

// ============ 主函数 ============

/**
 * 优化用户的音乐生成提示词
 *
 * @param options - 优化选项
 * @returns 优化后的提示词
 */
export async function optimizePrompt(options: OptimizePromptOptions): Promise<string> {
  const { rawPrompt, language = "zh", title, stylePresetId } = options;

  // 如果原始提示词太短，给出警告但仍然尝试处理
  if (rawPrompt.trim().length < 5) {
    console.warn("[PromptOptimizer] rawPrompt is very short:", rawPrompt);
  }

  const openai = getOpenAI();

  // 构建用户消息
  const userContent = `
用户输入的初始描述：
${rawPrompt}

可选标题：${title || "（无）"}
可选风格预设 ID：${stylePresetId || "（无）"}

请你把它整理成一段适合 AI 音乐生成的提示词描述，包含：
- 音乐风格（如流行、摇滚、Lo-fi、电影配乐等）
- 节奏和情绪（如轻快、温柔、史诗、适合学习/睡前/运动）
- 主要乐器（钢琴、吉他、弦乐、合成器等）
- 是否有人声，以及男声/女声/合唱
- 歌词主题（夏天、城市夜晚、成长、告别、旅行、爱情等）
- 使用场景（睡前、学习、跑步、vlog 背景、开车等）
- 指明语言（中文/英文/日文/纯音乐）

用一段 2-5 句的短文输出，不要列表，不要解释，只输出可以直接给音乐 AI 使用的提示词。
  `.trim();

  const systemContent = language === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH;

  console.log(`[PromptOptimizer] 开始优化提示词，语言: ${language}`);
  console.log(`[PromptOptimizer] 原始提示词: ${rawPrompt.substring(0, 50)}...`);

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const text = completion.choices[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("OpenAI returned empty response");
    }

    console.log(`[PromptOptimizer] 优化成功，结果长度: ${text.length}`);
    return text;
  } catch (error: any) {
    console.error("[PromptOptimizer] OpenAI API error:", error);
    
    // 提供更具体的错误信息
    if (error.code === "insufficient_quota") {
      throw new Error("OpenAI API 额度不足，请检查账户余额");
    }
    if (error.code === "invalid_api_key") {
      throw new Error("OpenAI API Key 无效");
    }
    if (error.code === "model_not_found") {
      throw new Error(`模型 ${OPENAI_MODEL} 不可用`);
    }
    
    throw new Error(`提示词优化失败: ${error.message || "未知错误"}`);
  }
}

// ============ 导出 ============

export default {
  optimizePrompt,
};

