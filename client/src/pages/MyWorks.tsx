import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
import {
  Music,
  Loader2,
  RefreshCw,
  Download,
  Clock,
  Calendar,
  Tag,
  ImageOff,
  Sparkles,
  ArrowRight,
  Lock,
} from "lucide-react";

// ============ 类型定义 ============

interface Track {
  id: string;
  title: string;
  prompt: string;
  audioUrl: string;
  imageUrl: string | null;
  coverImageUrl?: string | null; // OpenAI 生成的高质量封面
  duration: number | null;
  tags: string | null;
  modelName: string | null;
  createdAt: string;
}

interface TracksResponse {
  success: boolean;
  items: Track[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
}

// ============ 工具函数 ============

/**
 * 格式化时长（秒 → 分:秒）
 */
function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) {
    return "--:--";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 格式化日期时间
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============ 组件 ============

/**
 * 单个作品卡片
 */
function TrackCard({ track, canDownload }: { track: Track; canDownload: boolean }) {
  // 优先使用 OpenAI 生成的高质量封面，其次使用 Suno 原始图片
  const coverImage = track.coverImageUrl || track.imageUrl;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* 封面图片 - 优先展示 coverImageUrl */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={track.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <ImageOff className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        {/* 时长标签 */}
        {track.duration && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 right-2 bg-black/70 text-white border-none"
          >
            <Clock className="w-3 h-3 mr-1" />
            {formatDuration(track.duration)}
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1">{track.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {track.prompt}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 标签 */}
        {track.tags && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3 h-3 text-muted-foreground" />
            {track.tags.split(",").slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag.trim()}
              </Badge>
            ))}
          </div>
        )}

        {/* 创建时间 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {formatDateTime(track.createdAt)}
        </div>

        {/* 音频播放器 */}
        <div className="rounded-lg border bg-muted/50 p-2">
          <audio
            controls
            src={track.audioUrl}
            className="w-full h-8"
            preload="metadata"
            controlsList={!canDownload ? "nodownload" : undefined}
          >
            您的浏览器不支持音频播放
          </audio>
        </div>

        {/* 下载按钮 */}
        {canDownload ? (
          <a
            href={track.audioUrl}
            download={`${track.title}.mp3`}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            下载音频
          </a>
        ) : (
          <Link href="/auth">
            <div className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-muted text-muted-foreground text-sm cursor-pointer hover:bg-muted/80 transition-colors">
              <Lock className="w-4 h-4" />
              注册后可下载
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 空状态组件
 */
function EmptyState() {
  return (
    <Card className="text-center py-16">
      <CardContent>
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Music className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">还没有作品</h3>
        <p className="text-muted-foreground mb-6">
          快去创作你的第一首 AI 音乐吧！
        </p>
        <Link href="/suno-demo">
          <Button className="gap-2">
            <Sparkles className="w-4 h-4" />
            开始创作
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * 加载骨架屏
 */
function LoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden animate-pulse">
          <div className="aspect-square bg-muted" />
          <CardHeader className="pb-2">
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============ 主页面 ============

export default function MyWorks() {
  const { canDownload, quotaStats, isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Track[]>([]);
  const [total, setTotal] = useState(0);

  /**
   * 获取作品列表
   */
  const fetchTracks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/music/tracks");
      const data: TracksResponse = await response.json();

      if (data.success) {
        setItems(data.items);
        setTotal(data.total);
      } else {
        setError(data.error || "获取作品列表失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络请求失败");
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchTracks();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-6 py-16">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">我的作品</h1>
            </div>
            <p className="text-xl text-muted-foreground">My Works</p>
            
            {/* 额度提示 */}
            {quotaStats && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm">
                {quotaStats.plan === "guest" ? (
                  <span>游客：今日 {quotaStats.todayCount}/{quotaStats.dailyLimit || 1} 首，仅可试听</span>
                ) : quotaStats.plan === "free" ? (
                  <span>免费用户：本月已生成 {quotaStats.monthlyCount}/{quotaStats.monthlyLimit || 3} 首</span>
                ) : quotaStats.plan === "pro" ? (
                  <span>
                    会员用户：本月 {quotaStats.monthlyCount}/{quotaStats.monthlyLimit || 30} 首
                    {quotaStats.extraCredits > 0 && `，额外 Credits ${quotaStats.extraCredits}`}
                  </span>
                ) : (
                  <span>已生成 {quotaStats.totalCount} 首作品</span>
                )}
              </div>
            )}
          </div>

          {/* 操作栏 */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-muted-foreground">
              {!loading && !error && (
                <span>共 {total} 首作品</span>
              )}
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={fetchTracks}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                刷新
              </Button>
              <Link href="/suno-demo">
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  创作新歌
                </Button>
              </Link>
            </div>
          </div>

          {/* 内容区域 */}
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-red-500 mb-4">
                  <p className="font-medium">加载失败</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <Button variant="outline" onClick={fetchTracks}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试
                </Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((track) => (
                <TrackCard key={track.id} track={track} canDownload={canDownload} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

