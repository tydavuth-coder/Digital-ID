import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket } from "@/hooks/useWebSocket";
import { trpc } from "@/lib/trpc";
import { Bell, Check, FileCheck, UserPlus, AlertTriangle, Info, X, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function NotificationBell() {
  const { notifications: realtimeNotifications, isConnected, clearNotifications, removeNotification } = useWebSocket();
  
  // Fetch persisted notifications from database
  const { data: dbNotifications, refetch: refetchNotifications } = trpc.notifications.getMy.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
  });
  
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      clearNotifications();
      toast.success("All notifications marked as read");
    },
  });

  // Combine realtime and database notifications
  const allNotifications = [
    ...realtimeNotifications.map(n => ({
      id: `rt-${n.timestamp}`,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: false,
      createdAt: new Date(n.timestamp),
      isRealtime: true,
    })),
    ...(dbNotifications || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: new Date(n.createdAt),
      isRealtime: false,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "kyc_submission":
      case "success":
        return <FileCheck className="h-4 w-4 text-blue-500" />;
      case "user_registration":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "kyc_approval":
        return <Check className="h-4 w-4 text-green-500" />;
      case "kyc_rejection":
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "system_alert":
      case "error":
        return <Info className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleNotificationClick = (notification: any, index: number) => {
    if (notification.isRealtime) {
      removeNotification(index);
    } else if (!notification.isRead) {
      markAsReadMutation.mutate({ id: notification.id });
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {!isConnected && (
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-gray-400" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto py-1 px-2 text-xs"
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {allNotifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
            {isConnected && (
              <p className="text-xs mt-1 text-green-600">● Real-time updates active</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {allNotifications.slice(0, 20).map((notification, index) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-accent ${
                  !notification.isRead ? "bg-blue-50/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification, index)}
              >
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className={`text-sm leading-none ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                    {notification.isRealtime && (
                      <span className="ml-2 text-green-600">● Live</span>
                    )}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        {!isConnected && allNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-center text-orange-600">
              ⚠ Disconnected - Reconnecting...
            </div>
          </>
        )}
        
        {allNotifications.length > 20 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-center text-muted-foreground">
              Showing 20 of {allNotifications.length} notifications
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
