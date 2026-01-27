import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export function useWebSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket server
    const socket = io({
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket] Connected");
      setIsConnected(true);

      // Join admin room
      socket.emit("join-admin", {
        userId: user.id,
        role: user.role,
      });
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      setIsConnected(false);
    });

    // Listen for KYC submissions
    socket.on("kyc-submission", (data: NotificationData) => {
      console.log("[WebSocket] KYC submission received", data);
      setNotifications((prev) => [data, ...prev]);
      toast.info(data.title, {
        description: data.message,
        duration: 5000,
      });
    });

    // Listen for user registrations
    socket.on("user-registration", (data: NotificationData) => {
      console.log("[WebSocket] User registration received", data);
      setNotifications((prev) => [data, ...prev]);
      toast.success(data.title, {
        description: data.message,
        duration: 5000,
      });
    });

    // Listen for KYC approvals
    socket.on("kyc-approval", (data: NotificationData) => {
      console.log("[WebSocket] KYC approval received", data);
      setNotifications((prev) => [data, ...prev]);
      toast.success(data.title, {
        description: data.message,
        duration: 4000,
      });
    });

    // Listen for KYC rejections
    socket.on("kyc-rejection", (data: NotificationData) => {
      console.log("[WebSocket] KYC rejection received", data);
      setNotifications((prev) => [data, ...prev]);
      toast.warning(data.title, {
        description: data.message,
        duration: 4000,
      });
    });

    // Listen for system alerts
    socket.on("system-alert", (data: NotificationData & { severity: string }) => {
      console.log("[WebSocket] System alert received", data);
      setNotifications((prev) => [data, ...prev]);

      const toastFn =
        data.severity === "error"
          ? toast.error
          : data.severity === "warning"
            ? toast.warning
            : toast.info;

      toastFn(data.title, {
        description: data.message,
        duration: 6000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    isConnected,
    notifications,
    clearNotifications,
    removeNotification,
  };
}
