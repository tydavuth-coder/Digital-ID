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
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWebSocket } from "../websocket";

import { getFirebaseAdmin } from "./firebaseAdmin";
import fs from "fs";
import path from "path";

// DIAGNOSTIC LOGGING
console.log("\n\n==================================================");
console.log("🚀 STARTING DIGITAL ID ADMIN SERVER - v2.0 (DEBUG)");
console.log("==================================================");
console.log("Checking environment...");
const saPath = path.join(process.cwd(), "service-account.json");
if (fs.existsSync(saPath)) {
  console.log("✅ [Check] service-account.json FOUND at:", saPath);
  try {
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
    console.log("   -> Project ID in file:", sa.project_id);
  } catch (e) {
    console.log("   -> ❌ Error reading JSON:", e);
  }
} else {
  console.log("❌ [Check] service-account.json NOT FOUND at:", saPath);
}
console.log("==================================================\n");

// Initialize Firebase Admin immediately to test
try {
  getFirebaseAdmin();
  console.log("✅ [Check] Firebase Admin Initialized");
} catch (error) {
  console.error("❌ [Check] Firebase Admin Failed:", error);
}

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
