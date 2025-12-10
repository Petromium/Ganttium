/**
 * Development Server (NOT used in production)
 * 
 * This file is only used during local development with `npm run dev`.
 * Production uses server/index-prod.ts which has proper security controls.
 * 
 * Note: Rate limiting is not implemented here because:
 * 1. This is development-only code
 * 2. Production server (index-prod.ts) has rate limiting via express-rate-limit
 * 3. Cloud Run provides additional DDoS protection in production
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Server } from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { nanoid } from "nanoid";
import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";

import viteConfig from "../vite.config";
import runApp from "./app";

export async function setupVite(app: Express, server: Server) {
  const viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      // Security: Strict URL validation for development server
      // 1. Extract only the pathname (removes query params, hash, etc.)
      // 2. Validate path contains only safe characters
      // 3. Normalize to prevent path traversal attacks
      const rawUrl = req.originalUrl;
      let safePath: string;
      
      try {
        // Parse URL safely - only extract pathname
        const parsedUrl = new URL(rawUrl, 'http://localhost');
        safePath = parsedUrl.pathname;
      } catch {
        // Invalid URL - default to root
        safePath = '/';
      }
      
      // Security: Validate path contains only safe characters
      // Allow: alphanumeric, forward slashes, hyphens, underscores, dots
      // Reject: anything that could be used for XSS or path traversal
      const SAFE_PATH_REGEX = /^[a-zA-Z0-9/_.\-@]+$/;
      if (!SAFE_PATH_REGEX.test(safePath)) {
        // Sanitize unsafe paths by replacing dangerous characters
        safePath = safePath.replace(/[^a-zA-Z0-9/_.\-@]/g, '');
      }
      
      // Normalize path to prevent directory traversal
      safePath = path.posix.normalize(safePath);
      if (safePath.includes('..')) {
        safePath = '/';
      }

      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const versionedTemplate = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      
      // Transform HTML with Vite
      // Security: Use static "/" path instead of user input for Vite transform
      // The URL parameter is only used as a hint for Vite's module resolution
      // In SPA mode, all routes serve the same index.html anyway
      // This completely breaks the data flow from user input to output
      const page = await vite.transformIndexHtml("/", versionedTemplate);
      
      // Send response with strict Content-Type
      res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

(async () => {
  await runApp(setupVite);
})();
