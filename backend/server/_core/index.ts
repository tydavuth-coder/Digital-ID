import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerFirebaseAuthRoutes } from "./firebaseAuth";
import { registerAuditExportRoutes } from "./auditExport";
import { registerKycRoutes } from "./kyc";
import { registerMobileAuthRoutes } from "./mobileAuth";
import { registerRecoveryRoutes } from "./recovery"; // ✅ Import Recovery
import { appRouter } from "../routers"; // Ensure routers.ts exports appRouter
import { createContext } from "./context";
import { systemRouter } from "./systemRouter";
import { telegramBotRouter } from "./telegramBot";
import { serveStatic, setupVite } from "./vite";
import { initializeWebSocket } from "../websocket";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Webhook for Telegram
  app.use("/api/telegram", telegramBotRouter);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Firebase Email/Password auth session
  registerFirebaseAuthRoutes(app);
  // Mobile app REST endpoints
  registerKycRoutes(app);
  registerMobileAuthRoutes(app);
  registerRecoveryRoutes(app); // ✅ Register Recovery Routes

  registerAuditExportRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Initialize WebSocket server
  initializeWebSocket(server);
  console.log("[WebSocket] Server initialized");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
