import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Music2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { SEO, pageSEO } from "@/components/SEO";

interface ShowcaseMusicForm {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  genre: string;
  genreEn: string;
  audioUrl: string;
  username: string;
}

export default function AdminShowcaseMusic() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const seo = pageSEO.adminShowcase[locale];

  const [formData, setFormData] = useState<ShowcaseMusicForm>({
    title: "",
    titleEn: "",
    description: "",
    descriptionEn: "",
    genre: "",
    genreEn: "",
    audioUrl: "",
    username: "音为你",
  });

  const addMusicMutation = useMutation({
    mutationFn: async (data: ShowcaseMusicForm) => {
      const res = await apiRequest("POST", "/api/admin/showcase-music", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: locale === "zh" ? "成功" : "Success",
        description: locale === "zh" ? "展示音乐已添加" : "Showcase music added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/music/public"] });
      // Reset form
      setFormData({
        title: "",
        titleEn: "",
        description: "",
        descriptionEn: "",
        genre: "",
        genreEn: "",
        audioUrl: "",
        username: "音为你",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: locale === "zh" ? "错误" : "Error",
        description: error.message || (locale === "zh" ? "添加失败" : "Failed to add showcase music"),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMusicMutation.mutate(formData);
  };

  const handleChange = (field: keyof ShowcaseMusicForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      <SEO 
        title={seo.title} 
        description={seo.description} 
        locale={locale} 
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Music2 className="h-8 w-8" />
              {locale === "zh" ? "添加展示音乐" : "Add Showcase Music"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {locale === "zh" 
                ? "将新的展示音乐添加到首页榜单" 
                : "Add new showcase music to the homepage leaderboard"}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{locale === "zh" ? "音乐信息" : "Music Information"}</CardTitle>
            <CardDescription>
              {locale === "zh" 
                ? "请填写中文和英文的音乐信息。音频文件需要先上传到 client/public/showcase-music/ 目录" 
                : "Please provide music information in both Chinese and English. Audio files must be uploaded to client/public/showcase-music/ first"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Chinese Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{locale === "zh" ? "歌曲名称（中文）" : "Song Title (Chinese)"}</Label>
                <Input
                  id="title"
                  data-testid="input-title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder={locale === "zh" ? "例如：飞行的信任" : "e.g., 飞行的信任"}
                  required
                />
              </div>

              {/* English Title */}
              <div className="space-y-2">
                <Label htmlFor="titleEn">{locale === "zh" ? "歌曲名称（英文）" : "Song Title (English)"}</Label>
                <Input
                  id="titleEn"
                  data-testid="input-title-en"
                  value={formData.titleEn}
                  onChange={(e) => handleChange("titleEn", e.target.value)}
                  placeholder={locale === "zh" ? "例如：Flying Trust" : "e.g., Flying Trust"}
                  required
                />
              </div>

              {/* Chinese Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{locale === "zh" ? "描述（中文）" : "Description (Chinese)"}</Label>
                <Textarea
                  id="description"
                  data-testid="input-description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder={locale === "zh" ? "输入歌曲的中文描述..." : "Enter Chinese description..."}
                  rows={4}
                  required
                />
              </div>

              {/* English Description */}
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{locale === "zh" ? "描述（英文）" : "Description (English)"}</Label>
                <Textarea
                  id="descriptionEn"
                  data-testid="input-description-en"
                  value={formData.descriptionEn}
                  onChange={(e) => handleChange("descriptionEn", e.target.value)}
                  placeholder={locale === "zh" ? "输入歌曲的英文描述..." : "Enter English description..."}
                  rows={4}
                  required
                />
              </div>

              {/* Chinese Genre */}
              <div className="space-y-2">
                <Label htmlFor="genre">{locale === "zh" ? "风格（中文）" : "Genre (Chinese)"}</Label>
                <Input
                  id="genre"
                  data-testid="input-genre"
                  value={formData.genre}
                  onChange={(e) => handleChange("genre", e.target.value)}
                  placeholder={locale === "zh" ? "例如：都市旋律 / 电子流行 / 轻节奏" : "e.g., 都市旋律 / 电子流行 / 轻节奏"}
                  required
                />
              </div>

              {/* English Genre */}
              <div className="space-y-2">
                <Label htmlFor="genreEn">{locale === "zh" ? "风格（英文）" : "Genre (English)"}</Label>
                <Input
                  id="genreEn"
                  data-testid="input-genre-en"
                  value={formData.genreEn}
                  onChange={(e) => handleChange("genreEn", e.target.value)}
                  placeholder={locale === "zh" ? "例如：Urban Pop / Electronic Chill / Melodic Groove" : "e.g., Urban Pop / Electronic Chill / Melodic Groove"}
                  required
                />
              </div>

              {/* Audio URL */}
              <div className="space-y-2">
                <Label htmlFor="audioUrl">{locale === "zh" ? "音频文件路径" : "Audio File Path"}</Label>
                <Input
                  id="audioUrl"
                  data-testid="input-audio-url"
                  value={formData.audioUrl}
                  onChange={(e) => handleChange("audioUrl", e.target.value)}
                  placeholder="/showcase-music/your-song.mp3"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {locale === "zh" 
                    ? "格式：/showcase-music/文件名.mp3（文件需先上传到 client/public/showcase-music/ 目录）" 
                    : "Format: /showcase-music/filename.mp3 (file must be uploaded to client/public/showcase-music/ first)"}
                </p>
              </div>

              {/* Creator Name */}
              <div className="space-y-2">
                <Label htmlFor="username">{locale === "zh" ? "创作者" : "Creator"}</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  data-testid="button-submit"
                  disabled={addMusicMutation.isPending}
                  className="flex-1"
                >
                  {addMusicMutation.isPending 
                    ? (locale === "zh" ? "添加中..." : "Adding...") 
                    : (locale === "zh" ? "添加展示音乐" : "Add Showcase Music")}
                </Button>
                <Link href="/admin">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    {locale === "zh" ? "取消" : "Cancel"}
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{locale === "zh" ? "使用说明" : "Instructions"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {locale === "zh" ? "步骤 1：准备音频文件" : "Step 1: Prepare Audio File"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === "zh" 
                  ? "将MP3音频文件上传到服务器的 client/public/showcase-music/ 目录中" 
                  : "Upload the MP3 audio file to the server's client/public/showcase-music/ directory"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {locale === "zh" ? "步骤 2：填写表单" : "Step 2: Fill the Form"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === "zh" 
                  ? "填写所有中文和英文信息，音频文件路径格式为：/showcase-music/文件名.mp3" 
                  : "Fill in all Chinese and English information, audio file path format: /showcase-music/filename.mp3"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {locale === "zh" ? "步骤 3：提交" : "Step 3: Submit"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === "zh" 
                  ? "点击「添加展示音乐」按钮，音乐将立即显示在首页榜单中" 
                  : "Click 'Add Showcase Music' button, the music will appear on the homepage leaderboard immediately"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
