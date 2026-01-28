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

    // Dashboard នឹងហៅ event នេះនៅពេលបើកទំព័រ Login
    socket.on("join-login-session", () => {
       // មិនចាំបាច់ធ្វើអ្វីច្រើនទេ គ្រាន់តែដឹងថា socket.id នេះត្រៀមចាំទទួល Login
       console.log(`[WebSocket] Client ${socket.id} waiting for QR login`);
    });

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

// ==========================================
// NEW: Function to handle QR Login Success
// ==========================================
export function emitDashboardLoginSuccess(socketId: string, data: { token: string; user: any }) {
  if (!io) return;

  // បាញ់សញ្ញាទៅកាន់តែ Browser ជាក់លាក់ដែលកំពុងបង្ហាញ QR Code ប៉ុណ្ណោះ
  io.to(socketId).emit("dashboard-login-success", {
    type: "login_success",
    title: "Login Successful",
    message: "Mobile authentication verified.",
    token: data.token,
    user: data.user,
    timestamp: new Date().toISOString(),
  });

  console.log(`[WebSocket] Emitted dashboard login success for socket ${socketId}`);
}

// Notification event emitters (Existing code...)
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
}