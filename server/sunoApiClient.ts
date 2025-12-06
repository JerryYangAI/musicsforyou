/**
 * Suno API 客户端模块
 * 封装对 SunoAPI.org 第三方音乐生成 API 的调用
 *
 * 环境变量:
 * - SUNOAPI_BASE: API 基础地址 (例如 https://api.sunoapi.org/api/v1)
 * - SUNOAPI_KEY: API 密钥
 * - SUNOAPI_CALLBACK_URL: 回调地址（生产环境应设置为公网可访问的 HTTPS 地址）
 */

import axios, { AxiosError, AxiosInstance } from "axios";

// ============ 类型定义 ============

/**
 * SunoAPI 支持的模型版本
 * 根据 API 错误提示：只接受 V3_5, V4_5ALL, V4, V4_5, V4_5PLUS, V5
 */
export type SunoModel = "V3_5" | "V4" | "V4_5" | "V4_5ALL" | "V4_5PLUS" | "V5";

// 有效的模型值列表
const VALID_MODELS: SunoModel[] = ["V3_5", "V4", "V4_5", "V4_5ALL", "V4_5PLUS", "V5"];

// 默认模型版本
const DEFAULT_MODEL: SunoModel = "V5";

// 旧的 mv 值到新的 model 值的映射
const MV_TO_MODEL_MAP: Record<string, SunoModel> = {
  // 旧的 chirp 格式映射
  "chirp-v3-5": "V3_5",
  "chirp-v3.5": "V3_5",
  "chirp-v4": "V4",
  "chirp-v4-5": "V4_5",
  "chirp-v4.5": "V4_5",
  "chirp-v5": "V5",
  "chirp-v5-v2": "V5",
  // 直接使用新格式（大小写不敏感）
  "v3_5": "V3_5",
  "v4": "V4",
  "v4_5": "V4_5",
  "v4_5all": "V4_5ALL",
  "v4_5plus": "V4_5PLUS",
  "v5": "V5",
};

/**
 * 将传入的 model/mv 值规范化为 SunoAPI 接受的模型值
 * @param value 传入的模型值
 * @returns 规范化后的模型值，如果无法识别则返回默认值
 */
function normalizeModel(value: string | undefined | null): SunoModel {
  if (!value) {
    return DEFAULT_MODEL;
  }

  // 先检查是否已经是有效值（区分大小写）
  if (VALID_MODELS.includes(value as SunoModel)) {
    return value as SunoModel;
  }

  // 尝试从映射表中查找（转小写进行匹配）
  const lowerValue = value.toLowerCase();
  if (MV_TO_MODEL_MAP[lowerValue]) {
    return MV_TO_MODEL_MAP[lowerValue];
  }

  // 尝试直接转大写匹配
  const upperValue = value.toUpperCase();
  if (VALID_MODELS.includes(upperValue as SunoModel)) {
    return upperValue as SunoModel;
  }

  // 无法识别，使用默认值并打印警告
  console.warn(
    `[SunoAPI] 无法识别的模型值 "${value}"，使用默认值 "${DEFAULT_MODEL}"。` +
    `有效值为: ${VALID_MODELS.join(", ")}`
  );
  return DEFAULT_MODEL;
}

export interface GenerateMusicParams {
  prompt: string; // 必填，生成音乐的文案提示词（非自定义模式下作为歌曲描述）
  title?: string; // 可选，歌曲标题
  model?: SunoModel | string; // 可选，模型版本：V3_5, V4, V4_5, V4_5ALL, V4_5PLUS, V5（默认 V5）
  mv?: string; // 可选，兼容旧的 mv 字段，会自动映射到 model
  instrumental?: boolean; // 可选，是否纯伴奏，默认为 false
  customMode?: boolean; // 可选，是否启用自定义模式，默认为 false
  style?: string; // 可选，自定义模式下的音乐风格标签
  lyrics?: string; // 可选，自定义模式下的歌词内容
  callBackUrl?: string; // 可选，回调地址，SunoAPI 生成完成后会回调此地址
}

// 默认回调地址（开发环境）
const DEFAULT_CALLBACK_URL = "http://localhost:5000/api/music/webhook";

export interface GenerateMusicResult {
  taskId: string;
  raw: any;
}

export interface FetchMusicResult {
  status: "pending" | "generating" | "finished" | "failed";
  audioUrl?: string | null; // 主要音频 URL
  sourceAudioUrl?: string | null; // 源音频 URL（备选）
  imageUrl?: string | null; // 封面图片 URL
  sourceImageUrl?: string | null; // 源图片 URL（备选）
  videoUrl?: string | null; // 视频 URL
  sourceVideoUrl?: string | null; // 源视频 URL（备选）
  // 额外的元数据
  title?: string | null; // 歌曲标题
  prompt?: string | null; // 生成提示词
  duration?: number | null; // 时长（秒）
  tags?: string | null; // 风格标签
  modelName?: string | null; // 使用的模型
  raw: any;
}

// Suno API 原始响应类型
interface SunoApiGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    [key: string]: any;
  };
}

interface SunoApiRecordInfoResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status:
      | "PENDING"
      | "TEXT_SUCCESS"
      | "FIRST_SUCCESS"
      | "SUCCESS"
      | "CREATE_TASK_FAILED"
      | "GENERATE_AUDIO_FAILED"
      | "CALLBACK_EXCEPTION"
      | "SENSITIVE_WORD_ERROR";
    response?: {
      taskId: string;
      sunoData?: Array<{
        id: string;
        audioUrl: string;
        streamAudioUrl?: string;
        imageUrl?: string;
        videoUrl?: string;
        prompt: string;
        modelName: string;
        title: string;
        tags: string;
        createTime: string;
        duration: number;
      }>;
    };
    errorCode?: string | null;
    errorMessage?: string | null;
    [key: string]: any;
  };
}

// ============ 错误类 ============

export class SunoApiError extends Error {
  public statusCode?: number;
  public apiCode?: number;

  constructor(message: string, statusCode?: number, apiCode?: number) {
    super(message);
    this.name = "SunoApiError";
    this.statusCode = statusCode;
    this.apiCode = apiCode;
  }
}

// ============ 客户端类 ============

class SunoApiClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.SUNOAPI_BASE || "";
    this.apiKey = process.env.SUNOAPI_KEY || "";

    // 仅在实际使用时检查配置
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60 秒超时
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * 检查配置是否有效
   */
  private checkConfig(): void {
    if (!this.baseUrl) {
      throw new SunoApiError(
        "SUNOAPI_BASE 环境变量未配置。请在 .env 文件中设置 SUNOAPI_BASE=https://api.sunoapi.org/api/v1"
      );
    }

    if (!this.apiKey) {
      throw new SunoApiError(
        "SUNOAPI_KEY 环境变量未配置。请在 .env 文件中设置 SUNOAPI_KEY=your_api_key"
      );
    }
  }

  /**
   * 获取安全的 API Key 日志字符串（仅显示前后几位）
   */
  private getSafeApiKeyLog(): string {
    if (!this.apiKey || this.apiKey.length < 8) {
      return "***";
    }
    return `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`;
  }

  /**
   * 提交生成歌曲任务
   *
   * @param params 生成参数
   * @returns 任务 ID 和原始响应数据
   */
  async generateMusic(params: GenerateMusicParams): Promise<GenerateMusicResult> {
    this.checkConfig();

    // 参数校验
    if (!params.prompt || params.prompt.trim() === "") {
      throw new SunoApiError("prompt 参数不能为空");
    }

    try {
      // 确定是否使用自定义模式（默认为 false）
      const customMode = params.customMode ?? false;

      // 确定回调地址：优先使用参数传入 -> 环境变量 -> 默认值
      // 确保 callBackUrl 始终为非空字符串
      const callBackUrl =
        params.callBackUrl ||
        process.env.SUNOAPI_CALLBACK_URL ||
        DEFAULT_CALLBACK_URL;

      // 确定模型版本：优先使用 params.model -> params.mv（兼容映射） -> 默认值
      // normalizeModel 函数会校验并规范化模型值
      const model = normalizeModel(params.model ?? params.mv);

      console.log(`[SunoAPI] 开始生成音乐，API Key: ${this.getSafeApiKeyLog()}`);
      console.log(`[SunoAPI] 请求参数:`, {
        customMode,
        prompt: params.prompt.substring(0, 50) + (params.prompt.length > 50 ? "..." : ""),
        title: params.title,
        model,
        instrumental: params.instrumental,
        callBackUrl,
      });

      // 构建请求体，确保所有必需字段都有有效值
      const requestBody: Record<string, any> = {
        // customMode 必须为 boolean，不能为 null 或 undefined
        customMode: customMode,
        // prompt 在非自定义模式下作为歌曲描述
        prompt: params.prompt,
        // 歌曲标题，默认为空字符串
        title: params.title ?? "",
        // 是否纯伴奏，默认为 false
        instrumental: params.instrumental ?? false,
        // 模型版本（必填）：V3_5, V4, V4_5, V4_5ALL, V4_5PLUS, V5
        model: model,
        // 回调地址，SunoAPI 生成完成后会回调此地址（必填）
        callBackUrl: callBackUrl,
      };

      // 自定义模式下添加额外字段
      if (customMode) {
        // style 字段用于自定义模式的音乐风格
        if (params.style) {
          requestBody.style = params.style;
        }
        // lyrics 字段用于自定义模式的歌词
        if (params.lyrics) {
          requestBody.lyrics = params.lyrics;
        }
      }

      console.log(`[SunoAPI] 最终请求体:`, JSON.stringify(requestBody, null, 2));

      const response = await this.client.post<SunoApiGenerateResponse>(
        "/generate",
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      // 检查 API 返回码
      if (response.data.code !== 200) {
        throw new SunoApiError(
          `Suno API 返回错误: ${response.data.msg || "未知错误"}`,
          response.status,
          response.data.code
        );
      }

      // 检查 taskId
      if (!response.data.data?.taskId) {
        throw new SunoApiError("Suno API 未返回 taskId");
      }

      console.log(`[SunoAPI] 任务创建成功，taskId: ${response.data.data.taskId}`);

      return {
        taskId: response.data.data.taskId,
        raw: response.data.data,
      };
    } catch (error) {
      if (error instanceof SunoApiError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;

        if (axiosError.code === "ECONNABORTED") {
          throw new SunoApiError("请求超时，请稍后重试", 408);
        }

        if (axiosError.response) {
          const status = axiosError.response.status;
          const data = axiosError.response.data;
          const message = data?.msg || data?.message || axiosError.message;
          throw new SunoApiError(`Suno API 请求失败: ${message}`, status, data?.code);
        }

        if (axiosError.request) {
          throw new SunoApiError("无法连接到 Suno API 服务器，请检查网络连接");
        }
      }

      throw new SunoApiError(`生成音乐失败: ${(error as Error).message}`);
    }
  }

  /**
   * 根据 taskId 查询生成结果
   *
   * @param taskId 任务 ID
   * @returns 生成状态和结果
   */
  async fetchMusicResult(taskId: string): Promise<FetchMusicResult> {
    this.checkConfig();

    if (!taskId || taskId.trim() === "") {
      throw new SunoApiError("taskId 参数不能为空");
    }

    try {
      console.log(`[SunoAPI] 查询任务状态，taskId: ${taskId}`);

      const response = await this.client.get<SunoApiRecordInfoResponse>(
        "/generate/record-info",
        {
          params: { taskId },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      // 检查 API 返回码
      if (response.data.code !== 200) {
        throw new SunoApiError(
          `Suno API 返回错误: ${response.data.msg || "未知错误"}`,
          response.status,
          response.data.code
        );
      }

      const data = response.data.data;
      if (!data) {
        throw new SunoApiError("Suno API 未返回状态数据");
      }

      // 初始化结果变量
      let status: FetchMusicResult["status"];
      let audioUrl: string | null = null;
      let sourceAudioUrl: string | null = null;
      let imageUrl: string | null = null;
      let sourceImageUrl: string | null = null;
      let videoUrl: string | null = null;
      let sourceVideoUrl: string | null = null;
      let title: string | null = null;
      let prompt: string | null = null;
      let duration: number | null = null;
      let tags: string | null = null;
      let modelName: string | null = null;

      // 先尝试从 sunoData 中找到第一个有音频 URL 的元素
      const sunoData = data.response?.sunoData;
      let hasAudioAvailable = false;
      
      if (sunoData && sunoData.length > 0) {
        // 查找第一个有 audioUrl 或 sourceAudioUrl 的元素
        const trackWithAudio = sunoData.find(
          (item: any) => item.audioUrl || item.sourceAudioUrl
        );
        
        if (trackWithAudio) {
          hasAudioAvailable = true;
          // 提取音频 URL（优先使用 audioUrl，备选 sourceAudioUrl）
          audioUrl = trackWithAudio.audioUrl || null;
          sourceAudioUrl = trackWithAudio.sourceAudioUrl || null;
          // 提取图片 URL
          imageUrl = trackWithAudio.imageUrl || null;
          sourceImageUrl = trackWithAudio.sourceImageUrl || null;
          // 提取视频 URL
          videoUrl = trackWithAudio.videoUrl || null;
          sourceVideoUrl = trackWithAudio.sourceVideoUrl || null;
          // 提取元数据
          title = trackWithAudio.title || null;
          prompt = trackWithAudio.prompt || null;
          duration = trackWithAudio.duration || null;
          tags = trackWithAudio.tags || null;
          modelName = trackWithAudio.modelName || null;
        } else {
          // 即使没有音频，也尝试获取第一个元素的元数据
          const firstTrack = sunoData[0];
          title = firstTrack.title || null;
          prompt = firstTrack.prompt || null;
          tags = firstTrack.tags || null;
          modelName = firstTrack.modelName || null;
        }
      }

      // 状态映射逻辑：
      // 1. 如果有可用的音频 URL，则视为 "finished"（无论原始状态是什么）
      // 2. 否则根据原始状态映射
      if (hasAudioAvailable) {
        // 只要有音频可用，就视为完成
        status = "finished";
      } else {
        // 根据 SunoAPI 原始状态映射
        switch (data.status) {
          case "PENDING":
            status = "pending";
            break;
          case "TEXT_SUCCESS":
            status = "generating";
            break;
          case "FIRST_SUCCESS":
            // FIRST_SUCCESS 但没有音频，继续等待
            status = "generating";
            break;
          case "SUCCESS":
            // SUCCESS 但没有音频（异常情况）
            status = "finished";
            break;
          case "CREATE_TASK_FAILED":
          case "GENERATE_AUDIO_FAILED":
          case "CALLBACK_EXCEPTION":
          case "SENSITIVE_WORD_ERROR":
            status = "failed";
            break;
          default:
            status = "pending";
        }
      }

      console.log(`[SunoAPI] 任务状态: ${status}, 原始状态: ${data.status}, 有音频: ${hasAudioAvailable}`);
      if (audioUrl) {
        console.log(`[SunoAPI] 音频URL: ${audioUrl}`);
      }

      return {
        status,
        audioUrl,
        sourceAudioUrl,
        imageUrl,
        sourceImageUrl,
        videoUrl,
        sourceVideoUrl,
        title,
        prompt,
        duration,
        tags,
        modelName,
        raw: data,
      };
    } catch (error) {
      if (error instanceof SunoApiError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;

        if (axiosError.code === "ECONNABORTED") {
          throw new SunoApiError("请求超时，请稍后重试", 408);
        }

        if (axiosError.response) {
          const status = axiosError.response.status;
          const data = axiosError.response.data;
          const message = data?.msg || data?.message || axiosError.message;
          throw new SunoApiError(`Suno API 请求失败: ${message}`, status, data?.code);
        }

        if (axiosError.request) {
          throw new SunoApiError("无法连接到 Suno API 服务器，请检查网络连接");
        }
      }

      throw new SunoApiError(`查询任务状态失败: ${(error as Error).message}`);
    }
  }
}

// ============ 导出单例和函数 ============

const sunoApiClient = new SunoApiClient();

/**
 * 提交生成歌曲任务
 */
export async function generateMusic(
  params: GenerateMusicParams
): Promise<GenerateMusicResult> {
  return sunoApiClient.generateMusic(params);
}

/**
 * 根据 taskId 查询生成结果
 */
export async function fetchMusicResult(taskId: string): Promise<FetchMusicResult> {
  return sunoApiClient.fetchMusicResult(taskId);
}

export default sunoApiClient;

