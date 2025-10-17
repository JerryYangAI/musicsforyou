import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Music2, Guitar, Mic, Piano, Radio, X } from "lucide-react";
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
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState([60]);
  const [errors, setErrors] = useState<{ moods?: string; description?: string }>({});

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
    // Validate form
    const newErrors: { moods?: string; description?: string } = {};
    
    if (selectedMoods.length === 0) {
      newErrors.moods = t.music.moodPlaceholder;
    }
    
    if (description.trim().length < 10) {
      newErrors.description = t.music.detailPlaceholder;
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
      musicKeywords: keywords,
      musicDescription: description,
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

        {/* Keywords */}
        <div className="space-y-3">
          <Label htmlFor="keywords">{t.music.keywords}</Label>
          <div className="flex gap-2">
            <Input
              id="keywords"
              placeholder={t.music.keywordsPlaceholder}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              data-testid="input-keyword"
            />
            <Button onClick={addKeyword} data-testid="button-add-keyword">
              {t.music.addKeyword}
            </Button>
          </div>
          {keywords.length > 0 && (
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
          )}
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

        {/* Description */}
        <div className="space-y-3">
          <Label htmlFor="description">{t.music.detailDescription}</Label>
          <Textarea
            id="description"
            placeholder={t.music.detailPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
            data-testid="textarea-description"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {description.length}/500 {t.music.characterCount}
            </p>
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
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
