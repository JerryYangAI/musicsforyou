import { type User, type InsertUser, type MusicTrack, type InsertMusicTrack } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getPublicMusicTracks(limit?: number): Promise<MusicTrack[]>;
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private musicTracks: Map<string, MusicTrack>;

  constructor() {
    this.users = new Map();
    this.musicTracks = new Map();
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
    const user: User = { ...insertUser, id };
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
}

export const storage = new MemStorage();
