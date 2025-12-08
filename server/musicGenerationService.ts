import axios from "axios";

// 官方Suno API (sunoapi.org) 请求格式
export interface SunoGenerateRequest {
  prompt?: string; // 非自定义模式必需
  style?: string; // 自定义模式必需
  title?: string; // 自定义模式必需
  customMode?: boolean; // 是否使用自定义模式
  instrumental?: boolean; // 是否为器乐
  model?: string; // V3_5, V4, V4_5, V4_5PLUS, V5
  negativeTags?: string; // 逗号分隔的负面标签
  vocalGender?: "m" | "f"; // 人声性别
  styleWeight?: number; // 0-1，风格权重
  weirdnessConstraint?: number; // 0-1，独特性控制
  audioWeight?: number; // 0-1，音频元素平衡
  callBackUrl?: string; // 回调URL
}

// 官方Suno API 生成响应
export interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

// 官方Suno API 状态响应
export interface SunoStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    parentMusicId: string;
    param: string; // JSON字符串格式的参数
    response: {
      taskId: string;
      sunoData: Array<{
        id: string;
        audioUrl: string;
        streamAudioUrl: string;
        imageUrl: string;
        prompt: string;
        modelName: string;
        title: string;
        tags: string;
        createTime: string;
        duration: number;
      }>;
    };
    status: "PENDING" | "TEXT_SUCCESS" | "FIRST_SUCCESS" | "SUCCESS" | 
            "CREATE_TASK_FAILED" | "GENERATE_AUDIO_FAILED" | 
            "CALLBACK_EXCEPTION" | "SENSITIVE_WORD_ERROR";
    type: string;
    errorCode: string | null;
    errorMessage: string | null;
  };
}

export class MusicGenerationService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.SUNO_API_KEY || "";
    this.apiUrl = process.env.SUNO_API_URL || "https://api.sunoapi.org";

    if (!this.apiKey) {
      throw new Error("SUNO_API_KEY is required. Get your API key from https://sunoapi.org");
    }
  }

  /**
   * 构建风格描述（用于自定义模式）
   */
  buildStyle(params: {
    style: string;
    moods: string[];
    description: string;
  }): string {
    const { style, moods, description } = params;
    
    // 构建风格描述
    const styleMap: Record<string, string> = {
      pop: "Pop",
      rock: "Rock",
      jazz: "Jazz",
      electronic: "Electronic",
      hiphop: "Hip-Hop",
      classical: "Classical",
    };

    const styleDesc = styleMap[style] || style;

    // 构建情绪描述
    const moodMap: Record<string, string> = {
      happy: "happy, upbeat",
      sad: "melancholic, emotional",
      energetic: "energetic, dynamic",
      calm: "calm, peaceful",
      romantic: "romantic, tender",
      mysterious: "mysterious, atmospheric",
      epic: "epic, grand",
      relaxed: "relaxed, soothing",
    };

    const moodDesc = moods.map((mood) => moodMap[mood] || mood).join(", ");

    // 构建完整风格描述
    return `${styleDesc} style with ${moodDesc} mood. ${description}`;
  }

  /**
   * 调用官方Suno API生成音乐
   */
  async generateMusic(params: {
    description: string;
    style: string;
    moods: string[];
    duration: number;
    title?: string;
    voiceType?: "male" | "female";
  }): Promise<{ taskId: string; status: string }> {
    try {
      // 使用自定义模式，支持更详细的参数控制
      const style = this.buildStyle({
        style: params.style,
        moods: params.moods,
        description: params.description,
      });

      // 构建回调URL（如果配置了基础URL）
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:5000";
      const callBackUrl = `${baseUrl}/api/music/callback`; // 可以后续实现回调端点

      const requestData: SunoGenerateRequest = {
        customMode: true,
        instrumental: false, // 生成带人声的音乐
        prompt: params.description, // 歌词/主题提示
        style: style, // 风格描述
        title: params.title || params.description.substring(0, 80), // 标题（最多80字符）
        model: "V5", // 使用最新模型V5
        vocalGender: params.voiceType === "female" ? "f" : "m",
        // 可选参数
        styleWeight: 0.7,
        weirdnessConstraint: 0.5,
        audioWeight: 0.7,
        callBackUrl: callBackUrl, // 添加回调URL（API要求）
      };

      const response = await axios.post<SunoGenerateResponse>(
        `${this.apiUrl}/api/v1/generate`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000, // 30秒超时
        }
      );

      if (response.data.code !== 200) {
        throw new Error(`Suno API error: ${response.data.msg || "Unknown error"}`);
      }

      if (!response.data.data?.taskId) {
        throw new Error("No task ID returned from Suno API");
      }

      return {
        taskId: response.data.data.taskId,
        status: "PENDING",
      };
    } catch (error: any) {
      if (error.response) {
        const errorMsg = error.response.data?.msg || error.message;
        throw new Error(`Suno API error: ${errorMsg}`);
      }
      throw new Error(`Failed to generate music: ${error.message}`);
    }
  }

  /**
   * 获取生成状态和进度（官方Suno API）
   */
  async getGenerationStatus(taskId: string): Promise<{
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    audioUrl?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get<SunoStatusResponse>(
        `${this.apiUrl}/api/v1/generate/record-info`,
        {
          params: {
            taskId: taskId,
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 10000, // 10秒超时
        }
      );

      if (response.data.code !== 200) {
        throw new Error(`Suno API error: ${response.data.msg || "Unknown error"}`);
      }

      const data = response.data.data;
      if (!data) {
        throw new Error("No status data returned from Suno API");
      }

      // 映射官方API状态到我们的状态
      let mappedStatus: "pending" | "processing" | "completed" | "failed";
      let progress = 0;
      let audioUrl: string | undefined;
      let error: string | undefined;

      switch (data.status) {
        case "PENDING":
          mappedStatus = "pending";
          progress = 0;
          break;
        case "TEXT_SUCCESS":
        case "FIRST_SUCCESS":
          mappedStatus = "processing";
          progress = 50;
          break;
        case "SUCCESS":
          mappedStatus = "completed";
          progress = 100;
          // 获取第一个音频URL
          if (data.response?.sunoData && data.response.sunoData.length > 0) {
            audioUrl = data.response.sunoData[0].audioUrl;
          }
          break;
        case "CREATE_TASK_FAILED":
        case "GENERATE_AUDIO_FAILED":
        case "CALLBACK_EXCEPTION":
        case "SENSITIVE_WORD_ERROR":
          mappedStatus = "failed";
          progress = 0;
          error = data.errorMessage || data.status;
          break;
        default:
          mappedStatus = "pending";
          progress = 0;
      }

      return {
        status: mappedStatus,
        progress,
        audioUrl,
        error,
      };
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Suno API error: ${error.response.data?.msg || error.message}`
        );
      }
      throw new Error(`Failed to get generation status: ${error.message}`);
    }
  }

  /**
   * 下载生成的音频文件
   */
  async downloadAudio(audioUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(audioUrl, {
        responseType: "arraybuffer",
        timeout: 60000, // 60秒超时
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Failed to download audio: ${error.message}`);
    }
  }
}

// 单例模式
export const musicGenerationService = new MusicGenerationService();


