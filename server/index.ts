// server/index.ts
import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { join } from "path";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

console.log("[bootstrap] index.ts file loaded");

async function start() {
  console.log("[bootstrap] creating app & middlewares");
  const app = express();

  // 1) Stripe Webhook raw body（必须放在最前面，且只对这个路径生效）
  console.log("[bootstrap] register /api/webhook/stripe raw middleware");
  app.use("/api/webhook/stripe", express.raw({ type: "application/json" }));

  // 2) 其他常规中间件
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // 3) 静态资源（封面等）
  app.use("/static", express.static(join(process.cwd(), "public")));

  // 4) Session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  // 5) 简单 API 日志
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: any;

    const originalJson = res.json;
    res.json = function (body: any, ...args: any[]) {
      capturedJsonResponse = body;
      return originalJson.apply(this, [body, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (line.length > 120) line = line.slice(0, 119) + "…";
        log(line);
      }
    });

    next();
  });

  console.log("[bootstrap] before registerRoutes(app)");
  const server = await registerRoutes(app);
  console.log("[bootstrap] registerRoutes resolved");

  // 全局错误处理
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[global error handler]", err);
    res.status(status).json({ message });
  });

  // 启动音乐生成 worker（后台启动，不阻塞）
  void startWorker();

  // 根据环境选择前端服务方式
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    console.log("[bootstrap] development mode, calling setupVite");
    await setupVite(app, server);
    console.log("[bootstrap] setupVite done");
  } else {
    console.log("[bootstrap] production mode, calling serveStatic");
    serveStatic(app);
    console.log("[bootstrap] serveStatic done");
  }

  // 启动 HTTP 服务器
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";

  console.log("[bootstrap] calling server.listen");
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
    if (host === "0.0.0.0") {
      log(`Access the app at http://localhost:${port}`);
    } else {
      log(`Access the app at http://${host}:${port}`);
    }
  });
}

// 单独封装 worker 启动逻辑，失败也不影响主服务
async function startWorker() {
  const flag = process.env.ENABLE_MUSIC_WORKER ?? "1";
  if (flag === "0") {
    console.log("[worker] ENABLE_MUSIC_WORKER=0, skip starting worker");
    return;
  }

  try {
    console.log("[worker] importing ./worker …");
    const { createMusicGenerationWorker } = await import("./worker");
    console.log("[worker] worker module imported, creating worker");
    createMusicGenerationWorker();
    console.log("[worker] Music generation worker started");
  } catch (err) {
    console.error("[worker] Failed to start music generation worker:", err);
  }
}

// 顶层启动
start().catch((err) => {
  console.error("[bootstrap] fatal error in start()", err);
  process.exit(1);
});
