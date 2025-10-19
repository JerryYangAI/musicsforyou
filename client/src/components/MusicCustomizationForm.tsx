import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Music2, Guitar, Mic, Piano, Radio } from "lucide-react";
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
  const { t } = useLanguage();
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

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{t.music.customizeTitle}</CardTitle>
        <CardDescription>{t.music.customizeDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Music Style Selection */}
        <div className="space-y-3">
          <Label>{t.music.style}</Label>
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
                <span className="text-sm font-medium">{t.music.styles[style.id as keyof typeof t.music.styles]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood Selection */}
        <div className="space-y-3">
          <Label>{t.music.moodMultiSelect}</Label>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((mood) => (
              <Badge
                key={mood}
                variant={selectedMoods.includes(mood) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2"
                onClick={() => toggleMood(mood)}
                data-testid={`badge-mood-${mood}`}
              >
                {t.music.moods[mood as keyof typeof t.music.moods]}
              </Badge>
            ))}
          </div>
          {errors.moods && (
            <p className="text-sm text-destructive">{errors.moods}</p>
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
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSubmit}
          data-testid="button-submit-customization"
        >
          <Music2 className="w-5 h-5 mr-2" />
          {t.music.continuePay} ¥29.9
        </Button>
      </CardContent>
    </Card>
  );
}
