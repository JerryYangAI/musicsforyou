import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options); // 只记录，不中断
      },
    },
    server: {
      middlewareMode: true,
      hmr: {
        server,
        protocol: "ws",
        host: "localhost",
      },
      allowedHosts: true as const,
    },
    appType: "custom",
  });

  // 1) 先交给 Vite 处理静态与 HMR 资源
  app.use(vite.middlewares);

  // 2) Catch-all：仅处理 HTML 页面，其余交给后续/静态/接口
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;

    // 跳过 API、静态、Vite 资源（带扩展名/特殊前缀）
    if (
      url.startsWith("/api") ||
      url.startsWith("/objects") ||
      url.startsWith("/@") ||
      url.startsWith("/src/") ||
      url.includes(".")
    ) {
      return next();
    }

    try {
      const templatePath = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(templatePath, "utf-8");

      // 让 Vite 注入预编译脚本（React 插件需要）
      const page = await vite.transformIndexHtml(url, template);

      res
        .status(200)
        .set({ "Content-Type": "text/html; charset=utf-8" })
        .end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error("[vite] Error in catch-all route:", e);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // 生产模式下的静态目录（vite build 输出 dist/public）
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, please run "npm run build" first.`
    );
  }

  app.use(express.static(distPath));

  // 兜底返回 index.html（SPA）
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}