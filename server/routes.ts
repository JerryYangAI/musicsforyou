import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { z } from "zod";
import Stripe from "stripe";
import { insertOrderSchema, insertReviewSchema, insertMusicTrackSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { sendOrderNotification } from "./emailService";

// Use test key in development, production key in production
const stripeSecretKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_SECRET_KEY 
  : process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing required Stripe secret key');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-09-30.clover",
});

// Admin middleware
async function requireAdmin(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      // Store user in session
      req.session.userId = user.id;

      res.json({ 
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Find user by username
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Store user in session
      req.session.userId = user.id;

      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Change password endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      // Check if new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({ error: "New password must be different from current password" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  
  // Get public music tracks for the leaderboard (showcase tracks first)
  app.get("/api/music/public", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tracks = await storage.getPublicMusicTracks(limit);
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching music tracks:", error);
      res.status(500).json({ error: "Failed to fetch music tracks" });
    }
  });

  // Admin: Add showcase music
  app.post("/api/admin/showcase-music", requireAdmin, async (req, res) => {
    try {
      const trackData = insertMusicTrackSchema.parse({
        ...req.body,
        isShowcase: true,
        isPublic: true,
        userId: req.session.userId,
      });

      const track = await storage.createMusicTrack(trackData);
      res.json(track);
    } catch (error) {
      console.error("Error creating showcase music:", error);
      res.status(500).json({ error: "Failed to create showcase music" });
    }
  });

  // Get user's orders
  app.get("/api/orders", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const orders = await storage.getUserOrders(req.session.userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Create new order (after successful payment)
  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const order = await storage.createOrder(orderData);
      
      // Send email notification to admin (non-blocking)
      sendOrderNotification({
        orderId: order.id,
        amount: Number(order.amount),
        musicStyle: order.musicStyle || undefined,
        mood: order.musicMoods?.join(', ') || undefined,
        lyrics: order.musicDescription || undefined,
        createdAt: order.createdAt,
      }).catch(err => console.error('[Email] Notification error:', err));
      
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Admin: Get all orders
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Admin: Get single order details
  app.get("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Admin: Upload music file to order
  app.put("/api/admin/orders/:id/music", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { musicFileUrl } = req.body;

      if (!musicFileUrl) {
        return res.status(400).json({ error: "Music file URL is required" });
      }

      await storage.updateOrderMusicFile(id, musicFileUrl);
      res.json({ success: true });
    } catch (error) {
      console.error("Error uploading music:", error);
      res.status(500).json({ error: "Failed to upload music" });
    }
  });

  // Admin: Update order status
  app.put("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["pending", "processing", "completed", "failed", "cancelled", "closed"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.updateOrderStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Admin: Get order statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getOrderStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin: Get order statistics by date range
  app.get("/api/admin/stats/range", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const stats = await storage.getOrderStatsByDateRange(start, end);
      const orders = await storage.getOrdersByDateRange(start, end);
      
      res.json({ ...stats, orders });
    } catch (error) {
      console.error("Error fetching range stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Create review for an order
  app.post("/api/reviews", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { orderId, rating, comment } = req.body;

      // Verify order belongs to user
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.userId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to review this order" });
      }

      // Check if review already exists
      const existingReview = await storage.getOrderReview(orderId);
      if (existingReview) {
        return res.status(400).json({ error: "Review already exists for this order" });
      }

      const reviewData = {
        orderId,
        userId: req.session.userId,
        rating,
        comment: comment || null,
      };

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Get review for an order
  app.get("/api/orders/:id/review", async (req, res) => {
    try {
      const { id } = req.params;
      const review = await storage.getOrderReview(id);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });
  
  // Create payment intent for Stripe
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { amount, currency } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount is already in cents from frontend
        currency: currency || "cny",
        metadata: {
          userId: req.session.userId,
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Error creating payment intent: " + error.message });
    }
  });

  // Object Storage endpoints for admin music file uploads
  
  // Serve uploaded music files (with ACL-based access control)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Check ACL permissions before serving the file
      const userId = req.session.userId;
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get presigned URL for music file upload (admin only)
  app.post("/api/objects/upload", requireAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL: " + error.message });
    }
  });

  // Update order with uploaded music file (admin only)
  app.put("/api/music-files", requireAdmin, async (req, res) => {
    try {
      if (!req.body.musicFileURL || !req.body.orderId) {
        return res.status(400).json({ error: "musicFileURL and orderId are required" });
      }

      const { musicFileURL, orderId } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Set ACL policy for the uploaded file (public access)
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        musicFileURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      // Update order with the music file URL
      await storage.updateOrderMusicFile(orderId, objectPath);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error: any) {
      console.error("Error setting music file:", error);
      res.status(500).json({ error: "Internal server error: " + error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
