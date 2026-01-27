import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Server,
  Database,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";

export default function SystemAdminDashboard() {
  const { t } = useLanguage();
  
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();
  const { data: logs, isLoading: logsLoading } = trpc.logs.getAll.useQuery();
  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery();

  // Simulated system metrics (in real app, these would come from server monitoring)
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 38,
    networkLatency: 12,
    uptime: "99.9%",
    activeConnections: 24,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        cpuUsage: Math.min(100, Math.max(20, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.min(100, Math.max(30, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        networkLatency: Math.min(100, Math.max(5, prev.networkLatency + (Math.random() - 0.5) * 4)),
        activeConnections: Math.max(0, prev.activeConnections + Math.floor((Math.random() - 0.5) * 4)),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return "text-red-500";
    if (value >= thresholds.warning) return "text-orange-500";
    return "text-green-500";
  };

  const getProgressColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return "bg-red-500";
    if (value >= thresholds.warning) return "bg-orange-500";
    return "bg-green-500";
  };

  return (
    <DashboardLayout title="System Admin">
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          System Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor system health, performance metrics, and configurations
        </p>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Status
            </CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-lg font-semibold text-green-600">Operational</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Uptime: {systemMetrics.uptime}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Connections
            </CardTitle>
            <Wifi className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{systemMetrics.activeConnections}</div>
            <p className="text-xs text-muted-foreground mt-1">
              WebSocket connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Network Latency
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getStatusColor(systemMetrics.networkLatency, { warning: 50, danger: 100 })}`}>
              {systemMetrics.networkLatency.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maintenance Mode
            </CardTitle>
            <Shield className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {settingsLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <Badge variant={settings?.maintenanceMode ? "destructive" : "secondary"}>
                {settings?.maintenanceMode ? "Enabled" : "Disabled"}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              <Link href="/settings" className="text-primary hover:underline">
                Configure →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Resource Usage
            </CardTitle>
            <CardDescription>
              Real-time system resource monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CPU Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">CPU Usage</span>
                <span className={getStatusColor(systemMetrics.cpuUsage, { warning: 70, danger: 90 })}>
                  {systemMetrics.cpuUsage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={systemMetrics.cpuUsage} 
                className="h-2"
              />
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Memory Usage</span>
                <span className={getStatusColor(systemMetrics.memoryUsage, { warning: 75, danger: 90 })}>
                  {systemMetrics.memoryUsage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={systemMetrics.memoryUsage} 
                className="h-2"
              />
            </div>

            {/* Disk Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Disk Usage</span>
                <span className={getStatusColor(systemMetrics.diskUsage, { warning: 80, danger: 95 })}>
                  {systemMetrics.diskUsage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={systemMetrics.diskUsage} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Statistics
            </CardTitle>
            <CardDescription>
              Current database metrics and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Total Users</span>
                  <span className="text-lg font-bold">{stats?.totalUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Active Users</span>
                  <span className="text-lg font-bold text-green-600">{stats?.activeUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Pending KYC</span>
                  <span className="text-lg font-bold text-orange-600">{stats?.pendingKyc || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Active Sessions</span>
                  <span className="text-lg font-bold text-blue-600">{stats?.activeSessions || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent System Logs & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent System Logs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent System Logs</CardTitle>
              <CardDescription>
                Latest system activity and events
              </CardDescription>
            </div>
            <Link href="/logs">
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {logs.slice(0, 10).map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`mt-1.5 h-2 w-2 rounded-full ${
                        log.action.includes('error') || log.action.includes('fail') ? 'bg-red-500' :
                        log.action.includes('warn') ? 'bg-orange-500' :
                        log.action.includes('success') || log.action.includes('approve') ? 'bg-green-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.ipAddress && `IP: ${log.ipAddress} • `}
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No logs available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </Link>
            <Link href="/logs">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                View All Logs
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" className="w-full justify-start">
                <Server className="h-4 w-4 mr-2" />
                Manage Services
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start" disabled>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button variant="outline" className="w-full justify-start text-orange-600 hover:text-orange-700" disabled>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Toggle Maintenance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}
