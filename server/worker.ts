import { Worker } from "bullmq";
import { redisConnection } from "./queue";
import { musicGenerationService } from "./musicGenerationService";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

interface MusicGenerationJobData {
  orderId: string;
  userId: string;
  musicDescription: string;
  musicStyle: string;
  musicMoods: string[];
  musicKeywords?: string[];
  musicDuration: number;
  songTitle?: string;
  voiceType?: "male" | "female";
}

/**
 * 创建音乐生成Worker
 */
export function createMusicGenerationWorker() {
  const worker = new Worker<MusicGenerationJobData>(
    "music-generation",
    async (job) => {
      const {
        orderId,
        userId,
        musicDescription,
        musicStyle,
        musicMoods,
        musicKeywords,
        musicDuration,
        songTitle,
      } = job.data;

      console.log(`[Worker] Processing music generation for order ${orderId}`);

      try {
        // 1. 更新订单状态为processing
        await storage.updateOrderStatus(orderId, "processing");

        // 2. 调用Suno API生成音乐
        const generationResult = await musicGenerationService.generateMusic({
          description: musicDescription,
          style: musicStyle,
          moods: musicMoods,
          duration: musicDuration,
          title: songTitle,
          voiceType: job.data.voiceType || "male",
        });

        console.log(
          `[Worker] Music generation started, taskId: ${generationResult.taskId}`
        );

        // 创建生成任务记录
        const task = await storage.createMusicGenerationTask({
          orderId: orderId,
          taskId: generationResult.taskId,
          status: "pending",
          progress: 0,
        });

        // 3. 轮询获取生成进度
        let progress = 0;
        let status: "pending" | "processing" | "completed" | "failed" =
          "pending";
        let audioUrl: string | undefined;

        const maxPollingAttempts = 300; // 最多轮询300次（约10分钟）
        let pollingAttempts = 0;

        while (status !== "completed" && status !== "failed") {
          // 检查是否超时
          if (pollingAttempts >= maxPollingAttempts) {
            await storage.updateMusicGenerationTaskProgress(
              task.id,
              0,
              "failed",
              undefined,
              "Music generation timeout"
            );
            throw new Error("Music generation timeout");
          }

          // 等待2秒后再次查询
          await new Promise((resolve) => setTimeout(resolve, 2000));
          pollingAttempts++;

          // 获取生成状态
          const statusResult = await musicGenerationService.getGenerationStatus(
            generationResult.taskId
          );

          status = statusResult.status;
          progress = statusResult.progress || 0;
          audioUrl = statusResult.audioUrl;

          // 更新任务进度到数据库
          await storage.updateMusicGenerationTaskProgress(
            task.id,
            progress,
            status,
            audioUrl,
            statusResult.error
          );

          // 更新Job进度（用于BullMQ监控）
          await job.updateProgress(progress);

          console.log(
            `[Worker] Order ${orderId} progress: ${progress}% (status: ${status})`
          );

          if (status === "failed") {
            throw new Error(
              statusResult.error || "Music generation failed"
            );
          }

          if (status === "completed" && audioUrl) {
            break;
          }
        }

        if (!audioUrl) {
          throw new Error("No audio URL returned from generation");
        }

        // 4. 下载生成的音乐文件
        console.log(`[Worker] Downloading audio from ${audioUrl}`);
        const audioBuffer = await musicGenerationService.downloadAudio(audioUrl);

        // 5. 上传到对象存储
        const objectStorageService = new ObjectStorageService();
        const privateObjectDir = objectStorageService.getPrivateObjectDir();
        const objectId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const fullPath = `${privateObjectDir}/music/${objectId}.mp3`;
        
        // 获取上传URL
        const uploadUrl = await objectStorageService.getObjectEntityUploadURL();

        // 上传文件
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: audioBuffer,
          headers: {
            "Content-Type": "audio/mpeg",
          },
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload audio to object storage: ${errorText}`);
        }

        // 构建对象路径（格式: /objects/bucket-name/path/to/file）
        // 从fullPath提取路径，确保格式正确
        const objectPath = fullPath.startsWith("/") ? fullPath : `/${fullPath}`;

        // 设置ACL策略（公开访问）
        const finalObjectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          objectPath,
          {
            owner: userId,
            visibility: "public",
          }
        );

        // 6. 更新订单
        await storage.updateOrderMusicFile(orderId, finalObjectPath);
        await storage.updateOrderStatus(orderId, "completed");

        // 7. 创建音乐曲目记录
        const order = await storage.getOrder(orderId);
        if (order) {
          await storage.createMusicTrack({
            title: songTitle || musicDescription.substring(0, 50),
            description: musicDescription,
            genre: musicStyle,
            style: musicStyle,
            audioUrl: finalObjectPath,
            userId: userId,
            username: order.username || "User",
            isPublic: false, // 用户订单默认不公开
            isShowcase: false,
          });
        }

        console.log(
          `[Worker] Music generation completed for order ${orderId}, file: ${finalObjectPath}`
        );

        return {
          success: true,
          fileUrl: finalObjectPath,
          progress: 100,
        };
      } catch (error: any) {
        console.error(
          `[Worker] Error generating music for order ${orderId}:`,
          error
        );

        // 更新订单状态为失败
        await storage.updateOrderStatus(orderId, "failed");

        // 更新任务状态为失败（如果任务已创建）
        try {
          const task = await storage.getMusicGenerationTaskByOrderId(orderId);
          if (task) {
            await storage.updateMusicGenerationTaskProgress(
              task.id,
              task.progress || 0,
              "failed",
              undefined,
              error.message || "Music generation failed"
            );
          }
        } catch (taskError) {
          console.error("Failed to update task status:", taskError);
        }

        // 记录错误信息
        console.error(`[Worker] Error details:`, {
          orderId,
          error: error.message,
          stack: error.stack,
        });

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.QUEUE_CONCURRENCY || "5"), // 并发处理任务数
    }
  );

  // Worker事件监听
  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`[Worker] Error:`, err);
  });

  return worker;
}

