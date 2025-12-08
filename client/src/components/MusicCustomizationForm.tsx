import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Music2, Guitar, Mic, Piano, Radio, Check, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

const musicStyles = [
  { id: "pop", icon: Radio },
  { id: "rock", icon: Guitar },
  { id: "jazz", icon: Piano },
  { id: "electronic", icon: Music2 },
  { id: "hiphop", icon: Mic },
  { id: "classical", icon: Piano },
];

const moodOptions = ["happy", "sad", "energetic", "calm", "romantic", "mysterious", "epic", "relaxed"];

export function MusicCustomizationForm() {
  const { t, locale } = useLanguage();
  const [, setLocation] = useLocation();
  
  const [selectedStyle, setSelectedStyle] = useState<string>("pop");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["happy"]);
  const [lyrics, setLyrics] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [voiceType, setVoiceType] = useState<"male" | "female">("male");
  const [duration, setDuration] = useState([60]);
  const [errors, setErrors] = useState<{ moods?: string; lyrics?: string }>({});

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const handleSubmit = () => {
    // Validate form
    const newErrors: { moods?: string; lyrics?: string } = {};
    
    if (selectedMoods.length === 0) {
      newErrors.moods = t.music.moodPlaceholder;
    }
    
    if (lyrics.trim().length < 10) {
      newErrors.lyrics = t.music.lyricsPlaceholder;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Clear errors
    setErrors({});
    
    // Store order details in sessionStorage for the payment page
    const orderDetails = {
      musicStyle: selectedStyle,
      musicMoods: selectedMoods,
      musicDescription: lyrics,
      songTitle: songTitle || undefined,
      voiceType: voiceType,
      musicDuration: duration[0],
      amount: 29.90,
    };
    
    sessionStorage.setItem("orderDetails", JSON.stringify(orderDetails));
    setLocation("/payment");
  };

  // 计算表单完成度
  const formProgress = Math.round(
    ((selectedStyle ? 1 : 0) +
     (selectedMoods.length > 0 ? 1 : 0) +
     (lyrics.length >= 10 ? 1 : 0) +
     (duration[0] > 0 ? 1 : 0)) / 4 * 100
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 进度指示器 */}
      <Card className="gradient-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">{t.music.customizeTitle}</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{formProgress}%</span>
          </div>
          <Progress value={formProgress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">{t.music.customizeDescription}</p>
        </CardContent>
      </Card>

      <Card className="w-full border-2 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">{t.music.customizeTitle}</CardTitle>
          <CardDescription className="text-base">{t.music.customizeDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
        {/* Music Style Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            {t.music.style}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {musicStyles.map((style) => {
              const isSelected = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    isSelected
                      ? "gradient-border border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                  data-testid={`button-style-${style.id}`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected ? "bg-primary/20" : "bg-muted"
                  }`}>
                    <style.icon className={`w-6 h-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-sm font-semibold block ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {t.music.styles[style.id as keyof typeof t.music.styles]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">{t.music.moodMultiSelect}</Label>
          <div className="flex flex-wrap gap-3">
            {moodOptions.map((mood) => {
              const isSelected = selectedMoods.includes(mood);
              return (
                <button
                  key={mood}
                  onClick={() => toggleMood(mood)}
                  className={`group relative px-6 py-3 rounded-full border-2 transition-all duration-300 hover:scale-105 ${
                    isSelected
                      ? "gradient-primary text-white border-transparent shadow-lg"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                  data-testid={`badge-mood-${mood}`}
                >
                  {isSelected && (
                    <Check className="w-4 h-4 inline-block mr-2" />
                  )}
                  <span className="font-medium">{t.music.moods[mood as keyof typeof t.music.moods]}</span>
                </button>
              );
            })}
          </div>
          {errors.moods && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <span>⚠️</span>
              {errors.moods}
            </p>
          )}
        </div>

        {/* Lyrics/Keywords */}
        <div className="space-y-3">
          <Label htmlFor="lyrics">{t.music.lyrics}</Label>
          <Textarea
            id="lyrics"
            placeholder={t.music.lyricsPlaceholder}
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            maxLength={500}
            rows={4}
            data-testid="textarea-lyrics"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {lyrics.length}/500 {t.music.characterCount}
            </p>
            {errors.lyrics && (
              <p className="text-sm text-destructive">{errors.lyrics}</p>
            )}
          </div>
        </div>

        {/* Song Title (Optional) */}
        <div className="space-y-3">
          <Label htmlFor="songTitle">{t.music.songTitle}</Label>
          <Input
            id="songTitle"
            placeholder={t.music.songTitlePlaceholder}
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            maxLength={100}
            data-testid="input-song-title"
          />
        </div>

        {/* Voice Type Selection */}
        <div className="space-y-3">
          <Label>{t.music.voiceType}</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVoiceType("male")}
              className={`p-4 rounded-md border-2 transition-all hover-elevate ${
                voiceType === "male"
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
              data-testid="button-voice-male"
            >
              <Mic className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{t.music.maleVoice}</span>
            </button>
            <button
              onClick={() => setVoiceType("female")}
              className={`p-4 rounded-md border-2 transition-all hover-elevate ${
                voiceType === "female"
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
              data-testid="button-voice-female"
            >
              <Mic className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{t.music.femaleVoice}</span>
            </button>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>{t.music.duration}</Label>
            <span className="text-sm text-muted-foreground">{duration[0]}{t.music.durationUnit}</span>
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
            <span>30{t.music.durationUnit}</span>
            <span>180{t.music.durationUnit}</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t">
          <Button 
            className="w-full group gradient-primary text-white shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02]" 
            size="lg" 
            onClick={handleSubmit}
            data-testid="button-submit-customization"
          >
            <Music2 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">{t.music.continuePay}</span>
            <span className="ml-2 px-3 py-1 bg-white/20 rounded-lg">¥29.9</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            {t.music.generatingTips || "点击继续后将跳转到支付页面"}
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
