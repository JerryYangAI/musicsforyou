/**
 * Track 数据存储模块
 *
 * 使用本地 JSON 文件实现简单持久化存储
 * 支持基本的 CRUD 操作和并发写入保护
 */

import fs from "fs";
import path from "path";

// ============ 类型定义 ============

/**
 * Track 数据模型
 */
export interface Track {
  id: string;              // 内部 id，等于 taskId
  taskId: string;          // Suno 任务 ID
  title: string;           // 歌曲标题
  prompt: string;          // 生成提示词
  audioUrl: string;        // 音频 URL
  imageUrl: string | null; // Suno 原始封面图片 URL
  coverImageUrl?: string | null; // OpenAI 生成的高质量封面
  duration: number | null; // 时长（秒）
  tags: string | null;     // 风格标签
  modelName: string | null;// 使用的模型
  createdAt: string;       // 创建时间（ISO 字符串）
  userId: string;          // 用户 ID
  isPublic: boolean;       // 是否公开
}

/**
 * 存储文件中的数据结构
 */
interface TrackStoreData {
  tracks: Track[];
  lastUpdated: string;
}

// ============ 配置 ============

// 数据文件路径
const DATA_DIR = path.resolve(process.cwd(), "data");
const TRACKS_FILE = path.join(DATA_DIR, "tracks.json");

// ============ 内存缓存 ============

let tracksCache: Track[] | null = null;
let isWriting = false;
const writeQueue: Array<() => Promise<void>> = [];

// ============ 工具函数 ============

/**
 * 确保数据目录存在
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`[TrackStore] 创建数据目录: ${DATA_DIR}`);
  }
}

/**
 * 从文件读取数据
 */
function readFromFile(): TrackStoreData {
  ensureDataDir();

  if (!fs.existsSync(TRACKS_FILE)) {
    // 文件不存在，返回空数据
    return {
      tracks: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const content = fs.readFileSync(TRACKS_FILE, "utf-8");
    const data = JSON.parse(content) as TrackStoreData;
    return data;
  } catch (error) {
    console.error("[TrackStore] 读取文件失败:", error);
    // 文件损坏，返回空数据
    return {
      tracks: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * 写入数据到文件
 */
async function writeToFile(data: TrackStoreData): Promise<void> {
  ensureDataDir();

  const content = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(TRACKS_FILE, content, "utf-8");
}

/**
 * 处理写入队列（防止并发写入冲突）
 */
async function processWriteQueue(): Promise<void> {
  if (isWriting || writeQueue.length === 0) {
    return;
  }

  isWriting = true;

  while (writeQueue.length > 0) {
    const writeTask = writeQueue.shift();
    if (writeTask) {
      try {
        await writeTask();
      } catch (error) {
        console.error("[TrackStore] 写入任务失败:", error);
      }
    }
  }

  isWriting = false;
}

/**
 * 添加写入任务到队列
 */
function enqueueWrite(task: () => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    writeQueue.push(async () => {
      try {
        await task();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    processWriteQueue();
  });
}

/**
 * 加载缓存
 */
function loadCache(): Track[] {
  if (tracksCache === null) {
    const data = readFromFile();
    tracksCache = data.tracks;
    console.log(`[TrackStore] 加载了 ${tracksCache.length} 条 Track 记录`);
  }
  return tracksCache;
}

/**
 * 刷新缓存到文件
 */
async function flushCache(): Promise<void> {
  if (tracksCache === null) {
    return;
  }

  await enqueueWrite(async () => {
    const data: TrackStoreData = {
      tracks: tracksCache!,
      lastUpdated: new Date().toISOString(),
    };
    await writeToFile(data);
  });
}

// ============ 公共 API ============

/**
 * 获取用户的所有 Track
 *
 * @param userId 用户 ID
 * @returns Track 列表（按创建时间降序）
 */
export async function getAllTracks(userId: string): Promise<Track[]> {
  const tracks = loadCache();
  
  // 过滤用户的 tracks，按创建时间降序排列
  return tracks
    .filter((track) => track.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 获取所有公开的 Track
 *
 * @returns 公开的 Track 列表（按创建时间降序）
 */
export async function getPublicTracks(): Promise<Track[]> {
  const tracks = loadCache();
  
  return tracks
    .filter((track) => track.isPublic)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 根据 taskId 获取 Track
 *
 * @param taskId Suno 任务 ID
 * @returns Track 或 undefined
 */
export async function getTrackByTaskId(taskId: string): Promise<Track | undefined> {
  const tracks = loadCache();
  return tracks.find((track) => track.taskId === taskId);
}

/**
 * 根据 id 获取 Track
 *
 * @param id Track ID
 * @returns Track 或 undefined
 */
export async function getTrackById(id: string): Promise<Track | undefined> {
  const tracks = loadCache();
  return tracks.find((track) => track.id === id);
}

/**
 * 保存 Track（幂等操作，同 taskId 不会重复写入）
 *
 * @param track 要保存的 Track
 */
export async function saveTrack(track: Track): Promise<void> {
  const tracks = loadCache();

  // 检查是否已存在
  const existingIndex = tracks.findIndex((t) => t.taskId === track.taskId);
  
  if (existingIndex !== -1) {
    console.log(`[TrackStore] Track 已存在，跳过保存: ${track.taskId}`);
    return;
  }

  // 添加新 track
  tracks.push(track);
  tracksCache = tracks;

  // 异步写入文件
  await flushCache();
  
  console.log(`[TrackStore] 保存新 Track: ${track.taskId}, 标题: ${track.title}`);
}

/**
 * 更新 Track
 *
 * @param taskId 任务 ID
 * @param updates 要更新的字段
 * @returns 更新后的 Track 或 undefined
 */
export async function updateTrack(
  taskId: string,
  updates: Partial<Omit<Track, "id" | "taskId" | "createdAt">>
): Promise<Track | undefined> {
  const tracks = loadCache();

  const index = tracks.findIndex((t) => t.taskId === taskId);
  
  if (index === -1) {
    console.log(`[TrackStore] 未找到 Track: ${taskId}`);
    return undefined;
  }

  // 更新字段
  tracks[index] = {
    ...tracks[index],
    ...updates,
  };

  tracksCache = tracks;
  await flushCache();

  console.log(`[TrackStore] 更新 Track: ${taskId}`);
  return tracks[index];
}

/**
 * 删除 Track
 *
 * @param taskId 任务 ID
 * @returns 是否删除成功
 */
export async function deleteTrack(taskId: string): Promise<boolean> {
  const tracks = loadCache();

  const index = tracks.findIndex((t) => t.taskId === taskId);
  
  if (index === -1) {
    console.log(`[TrackStore] 未找到要删除的 Track: ${taskId}`);
    return false;
  }

  // 删除
  tracks.splice(index, 1);
  tracksCache = tracks;
  await flushCache();

  console.log(`[TrackStore] 删除 Track: ${taskId}`);
  return true;
}

/**
 * 获取 Track 总数
 *
 * @param userId 可选，指定用户
 * @returns Track 数量
 */
export async function getTrackCount(userId?: string): Promise<number> {
  const tracks = loadCache();
  
  if (userId) {
    return tracks.filter((t) => t.userId === userId).length;
  }
  
  return tracks.length;
}

/**
 * 分页获取 Tracks
 *
 * @param userId 用户 ID
 * @param page 页码（从 1 开始）
 * @param pageSize 每页数量
 * @returns 分页结果
 */
export async function getTracksPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{
  items: Track[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const allTracks = await getAllTracks(userId);
  const total = allTracks.length;
  const totalPages = Math.ceil(total / pageSize);
  
  // 计算分页偏移
  const offset = (page - 1) * pageSize;
  const items = allTracks.slice(offset, offset + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * 获取用户今日生成的 Track 数量
 *
 * @param userId 用户 ID
 * @returns 今日生成数量
 */
export async function getTodayCount(userId: string): Promise<number> {
  const tracks = loadCache();
  
  // 获取今天的开始时间（本地时区）
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  // 统计今天创建的 tracks
  return tracks.filter((track) => {
    if (track.userId !== userId) {
      return false;
    }
    const createdAt = new Date(track.createdAt).getTime();
    return createdAt >= todayStart;
  }).length;
}

/**
 * 获取用户今日的统计数据
 *
 * @param userId 用户 ID
 * @returns 统计数据
 */
export async function getTodayStats(userId: string): Promise<{
  todayCount: number;
  totalCount: number;
}> {
  const tracks = loadCache();
  
  // 获取今天的开始时间
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  let todayCount = 0;
  let totalCount = 0;

  for (const track of tracks) {
    if (track.userId !== userId) {
      continue;
    }
    totalCount++;
    const createdAt = new Date(track.createdAt).getTime();
    if (createdAt >= todayStart) {
      todayCount++;
    }
  }

  return { todayCount, totalCount };
}

/**
 * 获取用户本月生成的 Track 数量
 *
 * @param userId 用户 ID
 * @returns 本月生成数量
 */
export async function getMonthlyCount(userId: string): Promise<number> {
  const tracks = loadCache();
  
  // 获取本月的开始时间
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartTime = monthStart.getTime();

  // 统计本月创建的 tracks
  return tracks.filter((track) => {
    if (track.userId !== userId) {
      return false;
    }
    const createdAt = new Date(track.createdAt).getTime();
    return createdAt >= monthStartTime;
  }).length;
}

/**
 * 获取用户完整的额度统计数据
 *
 * @param userId 用户 ID
 * @returns 完整统计数据
 */
export async function getQuotaStats(userId: string): Promise<{
  todayCount: number;
  monthlyCount: number;
  totalCount: number;
}> {
  const tracks = loadCache();
  
  // 获取今天的开始时间
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  // 获取本月的开始时间
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartTime = monthStart.getTime();

  let todayCount = 0;
  let monthlyCount = 0;
  let totalCount = 0;

  for (const track of tracks) {
    if (track.userId !== userId) {
      continue;
    }
    totalCount++;
    const createdAt = new Date(track.createdAt).getTime();
    if (createdAt >= monthStartTime) {
      monthlyCount++;
    }
    if (createdAt >= todayStart) {
      todayCount++;
    }
  }

  return { todayCount, monthlyCount, totalCount };
}

/**
 * 更新 Track 的封面图片
 *
 * @param trackId Track ID
 * @param coverImageUrl 新的封面图片 URL
 * @returns 是否更新成功
 */
export async function updateTrackCover(trackId: string, coverImageUrl: string): Promise<boolean> {
  const tracks = loadCache();

  const index = tracks.findIndex((t) => t.id === trackId);
  
  if (index === -1) {
    console.log(`[TrackStore] 未找到要更新封面的 Track: ${trackId}`);
    return false;
  }

  // 更新封面字段
  tracks[index].coverImageUrl = coverImageUrl;
  tracksCache = tracks;
  await flushCache();

  console.log(`[TrackStore] 更新 Track 封面: ${trackId} -> ${coverImageUrl}`);
  return true;
}

// ============ 导出 ============

export default {
  getAllTracks,
  getPublicTracks,
  getTrackByTaskId,
  getTrackById,
  saveTrack,
  updateTrack,
  updateTrackCover,
  deleteTrack,
  getTrackCount,
  getTracksPaginated,
  getTodayCount,
  getTodayStats,
  getMonthlyCount,
  getQuotaStats,
};

