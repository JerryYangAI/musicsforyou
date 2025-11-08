-- 添加展示音乐到生产数据库（修复版）
-- 使用方法：在生产环境的数据库管理界面中运行此脚本

-- 1. 飞行的信任 (Flying Trust)
INSERT INTO music_tracks (
  id, 
  title, 
  title_en, 
  description, 
  description_en, 
  genre, 
  genre_en, 
  audio_url, 
  username, 
  is_public, 
  is_showcase, 
  created_at
) VALUES (
  gen_random_uuid(),
  '飞行的信任',
  'Flying Trust',
  '《飞行的信任》是一首描绘人与城市、信任与距离之间微妙关系的作品。旋律以电子钢琴等城市节奏感较强为主，融入轻盈的合成器音色与鸟类感受色彩乐符。仿佛在夜色中穿行的航班，闪烁着晴朗的光芒身心中；这首歌的灵感来自都市生活中的信任与漂泊——在匆促与孤独之间，人们依然怀揣信念，向前飞行。继续保护与抱抱之间。这是一首脚 带给市与美的悠闲，也是一次内心的飞行。旋律轻盈却知意深度，富有力量，让人在忙碌的节奏中感受到一种安静的勇气。',
  $$Flying Trust is a song that explores the nuanced relationship between individuals and the city, trust and distance. With a melody driven by the pulse of the city—anchored by electronic piano and sprinkled with airy synthesizer tones—it captures the shimmering motion of night flights cutting through urban darkness. The song draws inspiration from the tension of city life: the interplay of trust and transience, the simultaneous rush and solitude, and the belief that keeps us moving forward—flying, even when grounded. It speaks to the small moments of grace amid chaos, the quiet courage found in rhythm, and the beauty of human connection suspended between motion, distance, and belief.$$,
  '都市旋律 / 电子流行 / 轻节奏',
  'Urban Pop / Electronic Chill / Melodic Groove',
  '/showcase-music/flying-trust.mp3',
  '音为你',
  true,
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. 给鼎爷的歌 (Song for Dingye)
INSERT INTO music_tracks (
  id,
  title,
  title_en,
  description,
  description_en,
  genre,
  genre_en,
  audio_url,
  username,
  is_public,
  is_showcase,
  created_at
) VALUES (
  gen_random_uuid(),
  '给鼎爷的歌',
  'Song for Dingye',
  '《鼎爷的歌》是一首写给一位朋友友好真诚的致敬歌曲。旋律轻快，节奏明朗，如同初夏的阳光般温暖而治愈。作品以吉他与钢琴为基调，辅以温柔的弦乐与电子鼓轻敲，描绘属于普通人生活上的人生喜悦与共鸣。鼎爷凭借宅心仁厚与希望启迪周围人与希望，总能照亮旁边与希望。这首歌就像一份热情的拥抱，也是一种共情于彼此的温度，向所有善良勇敢的心致以敬意。《鼎爷的歌》像一杯温热的咖啡，也是一种疗愈真心距离，让人心中盈盈生辉，也感受在浮躁世界中依然存在的简单幸福。',
  $$Song for Dingye is a warm tribute to a dear friend whose sincerity brightens every room. With a light, uplifting melody anchored by guitar and piano, supported by gentle strings and soft electronic drums, the song paints a picture of everyday joy and human connection. Dingye is someone who carries kindness and hope like quiet lanterns, illuminating the paths of those around them. This track is both a heartfelt embrace and a celebration of simple goodness—it speaks to the warmth we share with each other, honoring all brave and generous hearts. Like a warm cup of coffee on a cool morning, Song for Dingye is a healing reminder that even in a hectic world, moments of simple happiness still shine brightly within us.$$,
  '流行 / 轻摇滚 / 致敬歌',
  'Pop / Light Rock / Tribute',
  '/showcase-music/song-for-dingye.mp3',
  '音为你',
  true,
  true,
  NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- 3. 给丽娟的歌 (Song for Lijuan)
INSERT INTO music_tracks (
  id,
  title,
  title_en,
  description,
  description_en,
  genre,
  genre_en,
  audio_url,
  username,
  is_public,
  is_showcase,
  created_at
) VALUES (
  gen_random_uuid(),
  '给丽娟的歌',
  'Song for Lijuan',
  '《丽娟的歌》是一首为致一位朋友自由友好真诚动人的调歌曲。旋律轻快，节奏明朗，如同初夏的阳光般温暖而治愈。作品以吉他能助成爱为题调，辅以温柔的弦乐整理欢跃，仿佛讲述着中学时保绸的暖意与青春。这首歌不仅是一份抓手，也是一种共情的温暖，让人每每想起那些阳光之下的美好。《丽娟的歌》像一杯温热的咖啡，也是一杯疗愈之歌，让人心中盈盈生辉，也是一段生命中无法忘怀的纪念。一段生命之光汇流。',
  $$Song for Lijuan is a tender ballad written for a lifelong friend whose warmth has remained constant through the years. The melody is soft and nostalgic, carried by acoustic guitar and gentle strings, evoking memories of youth and the comfort of enduring friendship. Like warm sunlight filtering through school windows, this song captures the sweetness of shared laughter and quiet support. It is not just a song—it is a heartfelt embrace, a tribute to those who make us feel understood. Song for Lijuan is like a warm cup of tea, a healing melody that fills the heart with gentle light, and a timeless reminder of the beautiful moments we carry with us forever.$$,
  '流行 / 轻摇滚 / 致敬歌',
  'Pop Ballad / Acoustic / Sentimental',
  '/showcase-music/song-for-lijuan.mp3',
  '音为你',
  true,
  true,
  NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- 4. 夏日海风 (Summer Sea Breeze)
INSERT INTO music_tracks (
  id,
  title,
  title_en,
  description,
  description_en,
  genre,
  genre_en,
  audio_url,
  username,
  is_public,
  is_showcase,
  created_at
) VALUES (
  gen_random_uuid(),
  '夏日海风',
  'Summer Sea Breeze',
  '清新的海边旋律，带来夏日的惬意感觉',
  'A fresh seaside melody that brings the comfort of summer',
  '轻音乐 / 海洋舒缓',
  'Light Music / Ocean Chill / Summer Pop',
  '/showcase-music/summer-sea-breeze.mp3',
  '音为你',
  true,
  true,
  NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;
