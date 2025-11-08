import { type User, type InsertUser, type MusicTrack, type InsertMusicTrack, type Order, type Review, type InsertReview, users, musicTracks, orders, reviews } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  getPublicMusicTracks(limit?: number): Promise<MusicTrack[]>;
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;
  getUserOrders(userId: string): Promise<Order[]>;
  createOrder(order: any): Promise<Order>;
  getOrder(orderId: string): Promise<Order | undefined>;
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getOrderReview(orderId: string): Promise<Review | undefined>;
  // Admin methods
  getAllOrders(): Promise<Order[]>;
  getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]>;
  updateOrderMusicFile(orderId: string, musicFileUrl: string): Promise<void>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
  getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    failed: number;
  }>;
  getOrderStatsByDateRange(startDate: Date, endDate: Date): Promise<{
    totalOrders: number;
    totalRevenue: string;
    avgOrderValue: string;
  }>;
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
      isAdmin: insertUser.isAdmin ?? false,
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
      titleEn: insertTrack.titleEn ?? null,
      description: insertTrack.description ?? null,
      descriptionEn: insertTrack.descriptionEn ?? null,
      genre: insertTrack.genre ?? null,
      genreEn: insertTrack.genreEn ?? null,
      style: insertTrack.style ?? null,
      audioUrl: insertTrack.audioUrl,
      userId: insertTrack.userId ?? null,
      username: insertTrack.username,
      isPublic: insertTrack.isPublic ?? true,
      isShowcase: insertTrack.isShowcase ?? false,
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

  async createOrder(order: any): Promise<Order> {
    // Not implemented for MemStorage, but return a mock order
    return {
      id: randomUUID(),
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    return undefined;
  }

  async createReview(review: InsertReview): Promise<Review> {
    return {
      id: randomUUID(),
      ...review,
      comment: review.comment ?? null,
      createdAt: new Date(),
    };
  }

  async getOrderReview(orderId: string): Promise<Review | undefined> {
    return undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return [];
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return [];
  }

  async updateOrderMusicFile(orderId: string, musicFileUrl: string): Promise<void> {
    // Not implemented for MemStorage
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    // Not implemented for MemStorage
  }

  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    failed: number;
  }> {
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      failed: 0,
    };
  }

  async getOrderStatsByDateRange(startDate: Date, endDate: Date): Promise<{
    totalOrders: number;
    totalRevenue: string;
    avgOrderValue: string;
  }> {
    return {
      totalOrders: 0,
      totalRevenue: "0",
      avgOrderValue: "0",
    };
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
      .orderBy(desc(musicTracks.isShowcase), desc(musicTracks.createdAt))
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

  async createOrder(orderData: any): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async getOrder(orderId: string): Promise<any | undefined> {
    const [order] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        username: users.username,
        musicDescription: orders.musicDescription,
        musicStyle: orders.musicStyle,
        musicMoods: orders.musicMoods,
        musicKeywords: orders.musicKeywords,
        musicDuration: orders.musicDuration,
        amount: orders.amount,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        orderStatus: orders.orderStatus,
        musicTrackId: orders.musicTrackId,
        stripePaymentIntentId: orders.stripePaymentIntentId,
        musicFileUrl: orders.musicFileUrl,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, orderId));
    return order;
  }

  // Review methods implementation
  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  async getOrderReview(orderId: string): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.orderId, orderId));
    return review;
  }

  // Admin methods implementation
  async getAllOrders(): Promise<any[]> {
    const allOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        username: users.username,
        musicDescription: orders.musicDescription,
        musicStyle: orders.musicStyle,
        musicMoods: orders.musicMoods,
        musicKeywords: orders.musicKeywords,
        musicDuration: orders.musicDuration,
        amount: orders.amount,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        orderStatus: orders.orderStatus,
        musicTrackId: orders.musicTrackId,
        stripePaymentIntentId: orders.stripePaymentIntentId,
        musicFileUrl: orders.musicFileUrl,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
    return allOrders;
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    const ordersInRange = await db
      .select()
      .from(orders)
      .where(and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      ))
      .orderBy(desc(orders.createdAt));
    return ordersInRange;
  }

  async updateOrderMusicFile(orderId: string, musicFileUrl: string): Promise<void> {
    await db
      .update(orders)
      .set({ 
        musicFileUrl,
        orderStatus: "completed",
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await db
      .update(orders)
      .set({ 
        orderStatus: status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));
  }

  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    failed: number;
  }> {
    const allOrders = await db.select().from(orders);
    
    return {
      total: allOrders.length,
      pending: allOrders.filter(o => o.orderStatus === "pending").length,
      processing: allOrders.filter(o => o.orderStatus === "processing").length,
      completed: allOrders.filter(o => o.orderStatus === "completed").length,
      cancelled: allOrders.filter(o => o.orderStatus === "cancelled").length,
      failed: allOrders.filter(o => o.orderStatus === "failed").length,
    };
  }

  async getOrderStatsByDateRange(startDate: Date, endDate: Date): Promise<{
    totalOrders: number;
    totalRevenue: string;
    avgOrderValue: string;
  }> {
    const ordersInRange = await this.getOrdersByDateRange(startDate, endDate);
    
    const totalRevenue = ordersInRange.reduce((sum, order) => {
      return sum + parseFloat(order.amount);
    }, 0);
    
    const avgOrderValue = ordersInRange.length > 0 
      ? (totalRevenue / ordersInRange.length).toFixed(2)
      : "0.00";
    
    return {
      totalOrders: ordersInRange.length,
      totalRevenue: totalRevenue.toFixed(2),
      avgOrderValue,
    };
  }
}

export const storage = new DbStorage();
