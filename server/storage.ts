import { type User, type InsertUser, type MusicTrack, type InsertMusicTrack, type Order, users, musicTracks, orders } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  getPublicMusicTracks(limit?: number): Promise<MusicTrack[]>;
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;
  getUserOrders(userId: string): Promise<Order[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private musicTracks: Map<string, MusicTrack>;

  constructor() {
    this.users = new Map();
    this.musicTracks = new Map();
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    const sampleTracks = [
      {
        title: "夏日海风",
        description: "清新的海边旋律，带来夏日的惬意感觉",
        style: "轻音乐, 海洋",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        username: "音乐爱好者小王",
        isPublic: true,
        userId: null,
      },
      {
        title: "都市节奏",
        description: "充满活力的电子音乐，展现现代都市生活",
        style: "电子, 流行",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        username: "DJ阿伟",
        isPublic: true,
        userId: null,
      },
      {
        title: "梦幻星空",
        description: "宁静悠远的旋律，仿佛置身星空之下",
        style: "氛围, 古典",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        username: "创作者小李",
        isPublic: true,
        userId: null,
      },
    ];

    for (const track of sampleTracks) {
      await this.createMusicTrack(track);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getPublicMusicTracks(limit: number = 10): Promise<MusicTrack[]> {
    const tracks = Array.from(this.musicTracks.values())
      .filter(track => track.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return tracks;
  }

  async createMusicTrack(insertTrack: InsertMusicTrack): Promise<MusicTrack> {
    const id = randomUUID();
    const track: MusicTrack = {
      id,
      title: insertTrack.title,
      description: insertTrack.description ?? null,
      style: insertTrack.style ?? null,
      audioUrl: insertTrack.audioUrl,
      userId: insertTrack.userId ?? null,
      username: insertTrack.username,
      isPublic: insertTrack.isPublic ?? true,
      createdAt: new Date(),
    };
    this.musicTracks.set(id, track);
    return track;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.password = hashedPassword;
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return [];
  }
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPublicMusicTracks(limit: number = 10): Promise<MusicTrack[]> {
    const tracks = await db
      .select()
      .from(musicTracks)
      .where(eq(musicTracks.isPublic, true))
      .orderBy(desc(musicTracks.createdAt))
      .limit(limit);
    return tracks;
  }

  async createMusicTrack(insertTrack: InsertMusicTrack): Promise<MusicTrack> {
    const [track] = await db.insert(musicTracks).values(insertTrack).returning();
    return track;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    return userOrders;
  }
}

export const storage = new DbStorage();
