import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Music2, Guitar, Mic, Piano, Drum, Radio, X } from "lucide-react";

const musicStyles = [
  { id: "pop", label: "流行", icon: Radio },
  { id: "rock", label: "摇滚", icon: Guitar },
  { id: "jazz", label: "爵士", icon: Piano },
  { id: "electronic", label: "电子", icon: Music2 },
  { id: "hiphop", label: "嘻哈", icon: Mic },
  { id: "classical", label: "古典", icon: Piano },
];

const moods = ["快乐", "悲伤", "激昂", "平静", "浪漫", "神秘", "史诗", "放松"];

export function MusicCustomizationForm() {
  const [selectedStyle, setSelectedStyle] = useState<string>("pop");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["快乐"]);
  const [keywords, setKeywords] = useState<string[]>(["夏天", "海边"]);
  const [keywordInput, setKeywordInput] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState([60]);

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const addKeyword = () => {
    if (keywordInput.trim() && keywords.length < 8) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleSubmit = () => {
    console.log("Music customization:", {
      style: selectedStyle,
      moods: selectedMoods,
      keywords,
      description,
      duration: duration[0],
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>定制您的音乐</CardTitle>
        <CardDescription>描述您想要的音乐风格、情绪和特点</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Music Style Selection */}
        <div className="space-y-3">
          <Label>音乐风格</Label>
          <div className="grid grid-cols-3 gap-3">
            {musicStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-4 rounded-md border-2 transition-all hover-elevate ${
                  selectedStyle === style.id
                    ? "border-primary bg-primary/10"
                    : "border-border"
                }`}
                data-testid={`button-style-${style.id}`}
              >
                <style.icon className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood Selection */}
        <div className="space-y-3">
          <Label>情绪氛围（可多选）</Label>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <Badge
                key={mood}
                variant={selectedMoods.includes(mood) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2"
                onClick={() => toggleMood(mood)}
                data-testid={`badge-mood-${mood}`}
              >
                {mood}
              </Badge>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-3">
          <Label htmlFor="keywords">关键词</Label>
          <div className="flex gap-2">
            <Input
              id="keywords"
              placeholder="添加关键词，如：海滩、夏日..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              data-testid="input-keyword"
            />
            <Button onClick={addKeyword} data-testid="button-add-keyword">
              添加
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="px-3 py-1">
                {keyword}
                <X
                  className="w-3 h-3 ml-2 cursor-pointer"
                  onClick={() => removeKeyword(keyword)}
                  data-testid={`button-remove-${keyword}`}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>时长</Label>
            <span className="text-sm text-muted-foreground">{duration[0]}秒</span>
          </div>
          <Slider
            value={duration}
            onValueChange={setDuration}
            min={30}
            max={180}
            step={15}
            data-testid="slider-duration"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30秒</span>
            <span>180秒</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <Label htmlFor="description">详细描述（可选）</Label>
          <Textarea
            id="description"
            placeholder="描述您想要的音乐细节，如乐器、节奏等..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            data-testid="textarea-description"
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 字符
          </p>
        </div>

        {/* Submit Button */}
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSubmit}
          data-testid="button-submit-customization"
        >
          <Music2 className="w-5 h-5 mr-2" />
          继续支付 ¥29.9
        </Button>
      </CardContent>
    </Card>
  );
}
