import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io/",
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on("join-admin", (data: { userId: number; role: string }) => {
      socket.join("admins");
      socket.join(`role-${data.role}`);
      console.log(`[WebSocket] Admin ${data.userId} joined with role ${data.role}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("WebSocket not initialized. Call initializeWebSocket first.");
  }
  return io;
}

// Notification event emitters
export function emitKYCSubmission(data: {
  userId: number;
  userName: string;
  kycId: number;
}) {
  if (!io) return;

  io.to("admins").emit("kyc-submission", {
    type: "kyc_submission",
    title: "New KYC Submission",
    message: `${data.userName} submitted KYC documents for verification`,
    data,
    timestamp: new Date().toISOString(),
  });

  console.log(`[WebSocket] Emitted KYC submission notification for user ${data.userId}`);
}

export function emitUserRegistration(data: {
  userId: number;
  userName: string;
  email: string;
}) {
  if (!io) return;

  io.to("admins").emit("user-registration", {
    type: "user_registration",
    title: "New User Registration",
    message: `${data.userName} (${data.email}) registered to the system`,
    data,
    timestamp: new Date().toISOString(),
  });

  console.log(`[WebSocket] Emitted user registration notification for user ${data.userId}`);
}

export function emitKYCApproval(data: {
  userId: number;
  userName: string;
  kycId: number;
  approvedBy: string;
}) {
  if (!io) return;

  io.to("admins").emit("kyc-approval", {
    type: "kyc_approval",
    title: "KYC Approved",
    message: `${data.userName}'s KYC was approved by ${data.approvedBy}`,
    data,
    timestamp: new Date().toISOString(),
  });

  console.log(`[WebSocket] Emitted KYC approval notification for user ${data.userId}`);
}

export function emitKYCRejection(data: {
  userId: number;
  userName: string;
  kycId: number;
  rejectedBy: string;
  reason: string;
}) {
  if (!io) return;

  io.to("admins").emit("kyc-rejection", {
    type: "kyc_rejection",
    title: "KYC Rejected",
    message: `${data.userName}'s KYC was rejected by ${data.rejectedBy}`,
    data,
    timestamp: new Date().toISOString(),
  });

  console.log(`[WebSocket] Emitted KYC rejection notification for user ${data.userId}`);
}

export function emitSystemAlert(data: {
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  targetRole?: string;
}) {
  if (!io) return;

  const room = data.targetRole ? `role-${data.targetRole}` : "admins";

  io.to(room).emit("system-alert", {
    type: "system_alert",
    title: data.title,
    message: data.message,
    severity: data.severity,
    timestamp: new Date().toISOString(),
  });

  console.log(`[WebSocket] Emitted system alert to ${room}: ${data.title}`);
}
