import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";

// Redis连接配置
const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
});

// 音乐生成任务队列
export const musicGenerationQueue = new Queue("music-generation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: parseInt(process.env.QUEUE_MAX_RETRIES || "3"),
    backoff: {
      type: "exponential",
      delay: 5000, // 初始延迟5秒
    },
    removeOnComplete: {
      age: 24 * 3600, // 保留24小时
      count: 1000, // 最多保留1000个
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 失败任务保留7天
    },
  },
});

// 队列事件监听器（用于监控和日志）
export const queueEvents = new QueueEvents("music-generation", {
  connection: redisConnection,
});

// 导出Redis连接（用于Worker）
export { redisConnection };


