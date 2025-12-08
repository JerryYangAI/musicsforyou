import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "./LanguageProvider";
import { Play, Pause, Music2, Sparkles, TrendingUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { MusicTrack } from "@shared/schema";

export function MusicLeaderboard() {
  const { t, locale } = useLanguage();
  const { data: tracks, isLoading } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music/public"],
  });

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlay = (track: MusicTrack) => {
    if (playingId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(track.audioUrl);
      audioRef.current = audio;
      
      audio.play();
      setPlayingId(track.id);

      audio.addEventListener("ended", () => {
        setPlayingId(null);
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t.leaderboard.title}</h2>
          </div>
          <div className="grid gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-muted rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{t.leaderboard.title}</h2>
          </div>
          <Card className="border-2 max-w-2xl mx-auto">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Music2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg text-muted-foreground">{t.leaderboard.noMusic}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {t.leaderboard.title}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text" data-testid="heading-leaderboard">
            {t.leaderboard.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.leaderboard.subtitle}
          </p>
        </div>
        <div className="grid gap-6 max-w-5xl mx-auto" data-testid="list-music-tracks">
          {tracks.map((track, index) => (
            <Card 
              key={track.id} 
              className="group hover-elevate transition-all duration-300 border-2 hover:border-primary/30 hover:shadow-xl"
              data-testid={`card-track-${track.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* 播放按钮 */}
                  <Button
                    size="icon"
                    onClick={() => handlePlay(track)}
                    className={`w-14 h-14 rounded-xl transition-all duration-300 ${
                      playingId === track.id 
                        ? "gradient-primary text-white shadow-lg scale-110" 
                        : "bg-muted hover:bg-primary/10 hover:scale-105"
                    }`}
                    data-testid={`button-play-${track.id}`}
                  >
                    {playingId === track.id ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>
                  
                  {/* 音乐信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-xl truncate" data-testid={`text-title-${track.id}`}>
                            {locale === "en" && track.titleEn ? track.titleEn : track.title}
                          </h3>
                          {track.isShowcase && (
                            <Badge className="gradient-primary text-white border-0">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {locale === "en" ? "Showcase" : "展示"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-username-${track.id}`}>
                          {t.leaderboard.creator}：<span className="font-medium text-foreground">{track.username}</span>
                        </p>
                      </div>
                    </div>
                    
                    {(track.description || track.descriptionEn) && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`text-description-${track.id}`}>
                        {locale === "en" && track.descriptionEn ? track.descriptionEn : track.description}
                      </p>
                    )}
                    
                    {(track.genre || track.genreEn) && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {t.leaderboard.style}：{locale === "en" && track.genreEn ? track.genreEn : track.genre}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
