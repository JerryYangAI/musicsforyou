/**
 * Suno 音乐生成 React Hook
 *
 * 用于调用后端 Suno API 接口生成音乐并轮询获取结果
 */

import { useState, useCallback, useRef } from "react";

// ============ 类型定义 ============

export interface GenerateMusicParams {
  prompt: string; // 必填，生成音乐的文案提示词
  title?: string; // 可选，歌曲标题
  mv?: string | null; // 可选，Suno 模型版本
  instrumental?: boolean; // 可选，是否纯伴奏
}

export interface GenerateMusicResponse {
  success: boolean;
  taskId?: string;
  raw?: any;
  error?: string;
}

export interface MusicResultResponse {
  success: boolean;
  status?: "pending" | "generating" | "finished" | "failed";
  audioUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  raw?: any;
  error?: string;
}

export interface UseSunoMusicState {
  isGenerating: boolean;
  isPolling: boolean;
  taskId: string | null;
  status: MusicResultResponse["status"] | null;
  audioUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  error: string | null;
}

export interface UseSunoMusicActions {
  generateMusic: (params: GenerateMusicParams) => Promise<string | null>;
  checkResult: (taskId: string) => Promise<MusicResultResponse>;
  startPolling: (taskId: string, intervalMs?: number, maxAttempts?: number) => void;
  stopPolling: () => void;
  reset: () => void;
}

// ============ API 调用函数 ============

/**
 * 提交生成歌曲任务
 */
export async function apiGenerateMusic(
  params: GenerateMusicParams
): Promise<GenerateMusicResponse> {
  const response = await fetch("/api/music/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  return data;
}

/**
 * 查询生成结果
 */
export async function apiCheckMusicResult(
  taskId: string
): Promise<MusicResultResponse> {
  const response = await fetch(`/api/music/result?taskId=${encodeURIComponent(taskId)}`);
  const data = await response.json();
  return data;
}

// ============ React Hook ============

/**
 * Suno 音乐生成 Hook
 *
 * @example
 * ```tsx
 * const {
 *   isGenerating,
 *   isPolling,
 *   status,
 *   audioUrl,
 *   error,
 *   generateMusic,
 *   startPolling,
 *   stopPolling,
 *   reset,
 * } = useSunoMusic();
 *
 * const handleGenerate = async () => {
 *   const taskId = await generateMusic({
 *     prompt: "一首关于夏天的流行歌曲",
 *     title: "夏日旋律",
 *   });
 *
 *   if (taskId) {
 *     // 开始轮询，每 3 秒检查一次，最多 100 次
 *     startPolling(taskId, 3000, 100);
 *   }
 * };
 * ```
 */
export function useSunoMusic(): UseSunoMusicState & UseSunoMusicActions {
  const [state, setState] = useState<UseSunoMusicState>({
    isGenerating: false,
    isPolling: false,
    taskId: null,
    status: null,
    audioUrl: null,
    imageUrl: null,
    videoUrl: null,
    error: null,
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    attemptCountRef.current = 0;
    setState((prev) => ({ ...prev, isPolling: false }));
  }, []);

  /**
   * 查询生成结果
   */
  const checkResult = useCallback(
    async (taskId: string): Promise<MusicResultResponse> => {
      const result = await apiCheckMusicResult(taskId);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          status: result.status ?? null,
          audioUrl: result.audioUrl ?? null,
          imageUrl: result.imageUrl ?? null,
          videoUrl: result.videoUrl ?? null,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error ?? "查询失败",
        }));
      }

      return result;
    },
    []
  );

  /**
   * 开始轮询
   */
  const startPolling = useCallback(
    (taskId: string, intervalMs = 3000, maxAttempts = 100) => {
      // 先停止已有的轮询
      stopPolling();

      setState((prev) => ({ ...prev, isPolling: true }));
      attemptCountRef.current = 0;

      const poll = async () => {
        attemptCountRef.current++;

        if (attemptCountRef.current > maxAttempts) {
          stopPolling();
          setState((prev) => ({
            ...prev,
            error: "轮询超时，请稍后手动查询结果",
          }));
          return;
        }

        try {
          const result = await checkResult(taskId);

          // 如果生成完成或失败，停止轮询
          if (result.status === "finished" || result.status === "failed") {
            stopPolling();
          }
        } catch (err) {
          console.error("[useSunoMusic] 轮询出错:", err);
          // 继续轮询，不因单次失败停止
        }
      };

      // 立即执行一次
      poll();

      // 设置定时轮询
      pollingRef.current = setInterval(poll, intervalMs);
    },
    [checkResult, stopPolling]
  );

  /**
   * 提交生成任务
   */
  const generateMusic = useCallback(
    async (params: GenerateMusicParams): Promise<string | null> => {
      setState((prev) => ({
        ...prev,
        isGenerating: true,
        error: null,
        taskId: null,
        status: null,
        audioUrl: null,
        imageUrl: null,
        videoUrl: null,
      }));

      try {
        const result = await apiGenerateMusic(params);

        if (result.success && result.taskId) {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            taskId: result.taskId!,
            status: "pending",
          }));
          return result.taskId;
        } else {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            error: result.error ?? "生成任务提交失败",
          }));
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "生成任务提交失败";
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: errorMsg,
        }));
        return null;
      }
    },
    []
  );

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    stopPolling();
    setState({
      isGenerating: false,
      isPolling: false,
      taskId: null,
      status: null,
      audioUrl: null,
      imageUrl: null,
      videoUrl: null,
      error: null,
    });
  }, [stopPolling]);

  return {
    ...state,
    generateMusic,
    checkResult,
    startPolling,
    stopPolling,
    reset,
  };
}

export default useSunoMusic;

