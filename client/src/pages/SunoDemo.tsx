import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  Music,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  FolderOpen,
  AlertTriangle,
  Sparkles,
  Download,
  Lock,
  Wand2,
  Lightbulb,
} from "lucide-react";
import { useSunoMusic } from "@/hooks/use-suno-music";

// ============ 类型定义 ============

interface MusicStats {
  todayCount: number;
  monthlyCount: number;
  totalCount: number;
  plan: "guest" | "free" | "pro" | "vip" | "admin";
  dailyLimit: number | null;
  monthlyLimit: number | null;
  extraCredits: number;
  remaining: number;
  canDownload: boolean;
}

/**
 * 状态对应的显示配置
 */
const STATUS_CONFIG = {
  pending: {
    label: "等待中",
    color: "bg-yellow-500",
    icon: Clock,
  },
  generating: {
    label: "生成中",
    color: "bg-blue-500",
    icon: Loader2,
  },
  finished: {
    label: "已完成",
    color: "bg-green-500",
    icon: CheckCircle,
  },
  failed: {
    label: "失败",
    color: "bg-red-500",
    icon: XCircle,
  },
};

/**
 * 预设风格配置（扩展到 8 个）
 */
interface StylePreset {
  id: string;
  emoji: string;
  label: string;
  description: string;
  defaultPrompt: string;
  defaultTitle: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "summer_pop",
    emoji: "🌊",
    label: "夏日海风 · 清新流行 Pop",
    description: "清新、轻快、海边夏天的感觉",
    defaultTitle: "夏日海风",
    defaultPrompt:
      "一首清新的中文流行歌曲，节奏轻快，有海边夏天的感觉，适合度假听。带男声主唱，歌词主题是海风、阳光、沙滩和恋爱心情。",
  },
  {
    id: "city_night",
    emoji: "🌃",
    label: "都市夜色 · City Pop / R&B",
    description: "适合夜晚开车或夜跑",
    defaultTitle: "城市夜色",
    defaultPrompt:
      "一首带一点 City Pop 和 R&B 气质的中文歌曲，律动感明显，适合夜晚开车或夜跑，歌词描写都市灯光和深夜的孤独与浪漫。",
  },
  {
    id: "ambient_sleep",
    emoji: "🌌",
    label: "星空冥想 · Ambient / 睡眠",
    description: "纯氛围、助眠、无鼓点",
    defaultTitle: "星空冥想",
    defaultPrompt:
      "一首纯音乐氛围音乐，节奏很慢，用铺底的合成器 Pad 和柔和的钢琴，适合睡前冥想和深度放松，没有鼓点，没有人声。",
  },
  {
    id: "lofi_study",
    emoji: "📚",
    label: "学习专注 · Lo-fi Beats",
    description: "Lo-fi Hip-hop，适合学习工作",
    defaultTitle: "深夜学习 Lo-fi",
    defaultPrompt:
      "一首 Lo-fi Hip-hop 风格的纯音乐，有温柔的鼓点、爵士和弦和轻微黑胶噪声，适合学习、写作和专注工作，没有人声。",
  },
  {
    id: "workout_energy",
    emoji: "🏃",
    label: "运动激励 · Electro / Rock",
    description: "高能量、强节奏、适合跑步健身",
    defaultTitle: "燃烧卡路里",
    defaultPrompt:
      "一首高能量的运动音乐，融合电子与摇滚，有强劲鼓点和合成器 Bass，适合跑步和健身，节奏在 120–135 BPM 左右，没有人声或只保留少量口号式人声。",
  },
  {
    id: "pop_rock",
    emoji: "🎸",
    label: "情绪摇滚 · Pop Rock",
    description: "电吉他+鼓，情绪从克制到爆发",
    defaultTitle: "不再退缩",
    defaultPrompt:
      "一首流行摇滚风格的中文歌曲，有电吉他、鼓和贝斯，情绪从克制到爆发，适合宣泄心情。男声主唱，歌词主题是成长、告别和自我和解。",
  },
  {
    id: "epic_cinematic",
    emoji: "🎻",
    label: "电影配乐 · Epic / Orchestral",
    description: "史诗感、宏大气势",
    defaultTitle: "英雄觉醒",
    defaultPrompt:
      "一首史诗电影配乐风格的纯音乐，用弦乐、铜管和大鼓营造宏大气势，从安静渐渐推向高潮，适合预告片、纪录片或震撼场景，没有人声。",
  },
  {
    id: "healing_piano",
    emoji: "🎹",
    label: "治愈钢琴 · Piano Ballad",
    description: "温柔钢琴独奏，疗愈安心",
    defaultTitle: "午后阳光",
    defaultPrompt:
      "一首温柔的钢琴独奏曲，旋律简单却有记忆点，节奏舒适，给人疗愈和安心的感觉，可以适合作为 vlog 的背景音乐。",
  },
];

export default function SunoDemo() {
  const { user, canDownload } = useAuth();
  const { toast } = useToast();
  
  // 表单状态
  const [prompt, setPrompt] = useState(
    "一首关于夏天的流行歌曲，旋律轻快，歌词描述海边的美好时光"
  );
  const [title, setTitle] = useState("夏天的海风");
  
  // 当前选中的预设风格
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // 统计数据状态
  const [stats, setStats] = useState<MusicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);

  // Prompt 优化状态
  const [optimizeLoading, setOptimizeLoading] = useState(false);

  // Suno 音乐生成 hook
  const {
    isGenerating,
    isPolling,
    taskId,
    status,
    audioUrl,
    imageUrl,
    coverImageUrl,
    error,
    generateMusic,
    startPolling,
    reset,
  } = useSunoMusic();

  // 优先使用 OpenAI 生成的高质量封面
  const displayCoverImage = coverImageUrl || imageUrl;

  /**
   * 获取统计数据
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/music/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data);
        setDailyLimitReached(data.remaining <= 0);
      }
    } catch (err) {
      console.error("获取统计数据失败:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 页面加载时获取统计数据
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 生成完成后刷新统计数据
  useEffect(() => {
    if (status === "finished") {
      fetchStats();
    }
  }, [status, fetchStats]);

  /**
   * 处理生成音乐
   */
  const handleGenerate = async () => {
    // 先检查是否达到限额
    if (dailyLimitReached) {
      return;
    }

    const newTaskId = await generateMusic({
      prompt,
      title,
    });

    if (newTaskId) {
      // 开始轮询，每 3 秒检查一次，最多 200 次（约 10 分钟）
      startPolling(newTaskId, 3000, 200);
    } else if (error) {
      // 检查是否是限额错误（通过 error 消息判断）
      if (error.includes("上限") || error.includes("DAILY_LIMIT")) {
        setDailyLimitReached(true);
        fetchStats(); // 刷新统计数据
      }
    }
  };

  /**
   * 重置所有状态
   */
  const handleReset = () => {
    reset();
    setPrompt("一首关于夏天的流行歌曲，旋律轻快，歌词描述海边的美好时光");
    setTitle("夏天的海风");
    setSelectedPresetId(null);
  };

  /**
   * 选择预设风格
   */
  const handlePresetClick = (preset: StylePreset) => {
    setPrompt(preset.defaultPrompt);
    setTitle(preset.defaultTitle);
    setSelectedPresetId(preset.id);
  };

  /**
   * 手动修改 prompt 时取消预设高亮
   */
  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setSelectedPresetId(null);
  };

  /**
   * 手动修改 title 时取消预设高亮
   */
  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSelectedPresetId(null);
  };

  /**
   * 一键优化提示词
   */
  const handleOptimizePrompt = async () => {
    if (!prompt.trim()) return;
    
    setOptimizeLoading(true);
    try {
      const res = await fetch("/api/prompt/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawPrompt: prompt,
          language: "zh",
          title,
          stylePresetId: selectedPresetId,
        }),
      });
      const data = await res.json();
      
      if (data.success && data.optimizedPrompt) {
        setPrompt(data.optimizedPrompt);
        setSelectedPresetId(null); // 优化后取消预设高亮
        toast({
          title: "提示词已优化",
          description: "AI 已帮你润色提示词，现在可以生成音乐了",
        });
      } else {
        toast({
          title: "优化失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Optimize request error:", e);
      toast({
        title: "网络错误",
        description: "无法连接到服务器，请检查网络后重试",
        variant: "destructive",
      });
    } finally {
      setOptimizeLoading(false);
    }
  };

  // 是否正在处理中（生成中或轮询中）
  const isProcessing = isGenerating || isPolling;

  // 获取状态配置
  const statusConfig = status ? STATUS_CONFIG[status] : null;
  const StatusIcon = statusConfig?.icon;

  // Debug 模式下显示 taskId（仅开发环境）
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto">
            {/* 标题区域 */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">Suno AI 音乐生成</h1>
              </div>
              <p className="text-xl text-muted-foreground mb-4">
                使用 AI 生成你的专属音乐
              </p>
              <Link href="/my-works">
                <Button variant="outline" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  查看我的作品
                </Button>
              </Link>
            </div>

            {/* 额度统计 */}
            {!statsLoading && stats && (
              <div className={`mb-8 p-4 rounded-xl border-2 ${
                dailyLimitReached 
                  ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900" 
                  : "bg-muted/50 border-border"
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {dailyLimitReached ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-primary" />
                    )}
                    <div>
                      {stats.plan === "guest" ? (
                        <>
                          <p className={`font-medium ${dailyLimitReached ? "text-red-700 dark:text-red-400" : ""}`}>
                            游客：今日已生成 {stats.todayCount}/{stats.dailyLimit || 1} 首
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <Link href="/auth" className="text-primary hover:underline">
                              注册后
                            </Link>
                            {" "}每月可生成 3 首并支持下载
                          </p>
                        </>
                      ) : stats.plan === "free" ? (
                        <>
                          <p className={`font-medium ${dailyLimitReached ? "text-red-700 dark:text-red-400" : ""}`}>
                            本月已生成：{stats.monthlyCount}/{stats.monthlyLimit || 3} 首
                          </p>
                          <p className="text-sm text-muted-foreground">
                            免费用户每月 {stats.monthlyLimit || 3} 首，
                            <Link href="/pricing" className="text-primary hover:underline">
                              升级会员
                            </Link>
                            {" "}可获得每月 30 首
                          </p>
                        </>
                      ) : stats.plan === "pro" ? (
                        <>
                          <p className="font-medium">
                            本月已生成：{stats.monthlyCount}/{stats.monthlyLimit || 30} 首
                            {stats.extraCredits > 0 && (
                              <span className="ml-2 text-primary">+ {stats.extraCredits} Credits</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            会员用户，剩余 {stats.remaining} 次生成机会
                          </p>
                        </>
                      ) : (
                        <p className="font-medium">
                          已生成 {stats.totalCount} 首作品
                        </p>
                      )}
                    </div>
                  </div>
                  {dailyLimitReached && (
                    <Badge variant="destructive" className="text-sm">
                      {stats.plan === "guest" ? "今日限额已满" : "额度已用完"}
                    </Badge>
                  )}
                </div>
                {dailyLimitReached && (
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {stats.plan === "guest" ? (
                        <>
                          您今日的生成次数已达上限，请明天再来或{" "}
                          <Link href="/auth" className="font-medium underline">
                            注册/登录
                          </Link>
                          {" "}获取更多次数。
                        </>
                      ) : stats.plan === "free" ? (
                        <>
                          本月免费额度已用完，{" "}
                          <Link href="/pricing" className="font-medium underline">
                            升级会员
                          </Link>
                          {" "}可获得每月 30 首。
                        </>
                      ) : (
                        <>
                          本月额度和 Credits 已用完，请{" "}
                          <Link href="/pricing" className="font-medium underline">
                            购买更多 Credits
                          </Link>
                          。
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 输入表单 */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>创作参数</CardTitle>
                <CardDescription>
                  选择一个风格预设，或自由描述你想要的音乐
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 预设风格按钮 - 8 个 */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    快速选择一个音乐风格
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset)}
                        disabled={isProcessing}
                        className={`
                          flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center
                          transition-all duration-200 hover:shadow-md
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${selectedPresetId === preset.id
                            ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }
                        `}
                      >
                        <span className="text-2xl">{preset.emoji}</span>
                        <span className={`text-xs font-medium leading-tight ${selectedPresetId === preset.id ? "text-primary" : ""}`}>
                          {preset.label.split(" · ")[0]}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                          {preset.description}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    点击预设快速填充，或自由编辑下方内容
                  </p>
                </div>

                {/* 分隔线 */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">或自定义描述</span>
                  </div>
                </div>

                {/* Prompt 输入 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt">音乐描述 (Prompt)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={optimizeLoading || !prompt.trim() || isProcessing}
                      onClick={handleOptimizePrompt}
                      className="gap-1.5"
                    >
                      {optimizeLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          优化中...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          帮我优化提示词
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="prompt"
                    placeholder="描述你想要的音乐风格、情感、主题..."
                    value={prompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    disabled={isProcessing}
                    rows={4}
                    className="resize-none"
                  />
                  
                  {/* Prompt 引导文案 */}
                  <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">💡 提示词写作指南</p>
                        <p>尽量描述清楚这些要素，AI 会更懂你：</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          <li><b>风格</b>：流行 / 摇滚 / City Pop / Lo-fi / 电影配乐 / 氛围 / 电子舞曲…</li>
                          <li><b>节奏与情绪</b>：轻快、温柔、悲伤、史诗、适合睡前 / 学习 / 运动等</li>
                          <li><b>乐器</b>：钢琴、吉他、弦乐、合成器、电吉他、鼓组…</li>
                          <li><b>人声</b>：男声 / 女声 / 合唱 / 纯音乐，是否需要歌词</li>
                          <li><b>歌词主题</b>：夏天、城市夜晚、成长、告别、旅行、爱情…</li>
                          <li><b>语言</b>：中文 / 英文 / 日文 / 纯哼唱</li>
                        </ul>
                        <p className="text-xs italic mt-2">
                          例如：「一首中文流行歌曲，节奏轻快，适合夏天开车听，男声主唱，歌词主题是海边、公路和自由。」
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title 输入 */}
                <div className="space-y-2">
                  <Label htmlFor="title">歌曲标题</Label>
                  <Input
                    id="title"
                    placeholder="给你的音乐起个名字..."
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={isProcessing || !prompt.trim() || dailyLimitReached}
                    className={`flex-1 ${dailyLimitReached ? "bg-muted text-muted-foreground" : ""}`}
                    size="lg"
                  >
                    {dailyLimitReached ? (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        明日再试
                      </>
                    ) : isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        提交中...
                      </>
                    ) : isPolling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Music className="mr-2 h-4 w-4" />
                        生成音乐
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isProcessing}
                    size="lg"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    重置
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 错误信息 */}
            {error && (
              <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-700 dark:text-red-400">
                        生成失败
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        {error}
                      </p>
                      {/* 限额错误时的引导 */}
                      {(error.includes("游客") || error.includes("DAILY_LIMIT_GUEST")) && (
                        <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-sm text-muted-foreground mb-2">
                            注册账号可解锁更多生成次数和下载权限。
                          </p>
                          <Link href="/auth">
                            <Button size="sm" variant="outline">
                              立即注册
                            </Button>
                          </Link>
                        </div>
                      )}
                      {(error.includes("免费额度") || error.includes("MONTHLY_LIMIT_FREE")) && (
                        <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-sm text-muted-foreground mb-2">
                            升级 Pro 会员可每月生成 30 首，并支持购买额外 Credits。
                          </p>
                          <Link href="/pricing">
                            <Button size="sm" variant="outline">
                              查看会员方案
                            </Button>
                          </Link>
                        </div>
                      )}
                      {(error.includes("Credits") || error.includes("NEED_TOPUP")) && (
                        <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-sm text-muted-foreground mb-2">
                            你已用完本月 Pro 额度和 Credits，可以购买扩展包继续创作。
                          </p>
                          <Link href="/pricing">
                            <Button size="sm" variant="outline">
                              购买 Credits
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 状态和结果展示（隐藏 taskId） */}
            {(taskId || status) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>生成结果</CardTitle>
                    {statusConfig && (
                      <Badge
                        variant="secondary"
                        className={`${statusConfig.color} text-white`}
                      >
                        {StatusIcon && (
                          <StatusIcon
                            className={`mr-1 h-3 w-3 ${
                              status === "generating" ? "animate-spin" : ""
                            }`}
                          />
                        )}
                        {statusConfig.label}
                      </Badge>
                    )}
                  </div>
                  {/* 仅在开发模式下显示 taskId */}
                  {isDev && taskId && (
                    <CardDescription className="font-mono text-xs opacity-50">
                      [DEV] Task ID: {taskId}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 封面图片 - 优先展示 OpenAI 生成的高质量封面 */}
                  {displayCoverImage && (
                    <div className="space-y-2">
                      <Label>
                        封面
                        {coverImageUrl && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            AI 高清
                          </Badge>
                        )}
                      </Label>
                      <div className="rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={displayCoverImage}
                          alt="Music Cover"
                          className="w-full max-w-md mx-auto object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* 音频播放器 */}
                  {audioUrl && (
                    <div className="space-y-3">
                      <Label>音频</Label>
                      <div className="rounded-lg border bg-muted p-4">
                        <audio
                          controls
                          src={audioUrl}
                          className="w-full"
                          preload="metadata"
                          controlsList={!canDownload ? "nodownload" : undefined}
                        >
                          您的浏览器不支持音频播放
                        </audio>
                      </div>
                      
                      {/* 下载按钮 - 仅登录用户可见 */}
                      <div className="flex items-center gap-3">
                        {canDownload ? (
                          <a
                            href={audioUrl}
                            download={`${title || "music"}.mp3`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            下载音频
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm">
                            <Lock className="w-4 h-4" />
                            <span>
                              <Link href="/auth" className="text-primary hover:underline">
                                注册/登录
                              </Link>
                              {" "}后可下载
                            </span>
                          </div>
                        )}
                        <a
                          href={audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary hover:underline"
                        >
                          在新标签页中打开
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 等待提示 */}
                  {isPolling && !audioUrl && (
                    <div className="text-center py-8">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        AI 正在创作音乐，请稍候...
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        通常需要 1-3 分钟
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
