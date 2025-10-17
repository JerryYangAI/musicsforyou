import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { MusicTrack } from "@shared/schema";

export function MusicLeaderboard() {
  const { data: tracks, isLoading } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music/public"],
  });

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const audio = new Audio(track.audioUrl);
      audioRef.current = audio;
      
      audio.play();
      setPlayingId(track.id);

      timeoutRef.current = setTimeout(() => {
        audio.pause();
        setPlayingId(null);
      }, 10000);

      audio.addEventListener("ended", () => {
        setPlayingId(null);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">音乐试听榜单</h2>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded" />
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
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">音乐试听榜单</h2>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">暂无公开音乐作品</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-card/50">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center" data-testid="heading-leaderboard">
          音乐试听榜单
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          发现其他用户创作的精彩音乐，每首支持试听10秒
        </p>
        <div className="grid gap-4 max-w-4xl mx-auto" data-testid="list-music-tracks">
          {tracks.map((track) => (
            <Card key={track.id} data-testid={`card-track-${track.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant={playingId === track.id ? "default" : "outline"}
                    onClick={() => handlePlay(track)}
                    data-testid={`button-play-${track.id}`}
                  >
                    {playingId === track.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" data-testid={`text-title-${track.id}`}>
                      {track.title}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-username-${track.id}`}>
                      创作者：{track.username}
                    </p>
                    {track.description && (
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-description-${track.id}`}>
                        {track.description}
                      </p>
                    )}
                    {track.style && (
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-style-${track.id}`}>
                        风格：{track.style}
                      </p>
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
