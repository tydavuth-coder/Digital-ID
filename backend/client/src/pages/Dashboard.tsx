import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  FileCheck, 
  UserCheck, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Dashboard() {
  const { t } = useLanguage();
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();
  const { data: recentLogs } = trpc.logs.getAll.useQuery();

  // Mock data for charts (in production, this would come from the API)
  const userGrowthData = [
    { month: "Jan", users: 45 },
    { month: "Feb", users: 52 },
    { month: "Mar", users: 61 },
    { month: "Apr", users: 73 },
    { month: "May", users: 89 },
    { month: "Jun", users: 105 },
  ];

  const kycStatusData = [
    { name: "Approved", value: stats?.totalUsers ? stats.totalUsers - stats.pendingKyc : 0, color: "#10b981" },
    { name: "Pending", value: stats?.pendingKyc || 0, color: "#f59e0b" },
    { name: "Rejected", value: 5, color: "#ef4444" },
  ];

  const activityData = [
    { day: "Mon", logins: 24, kyc: 8, services: 12 },
    { day: "Tue", logins: 31, kyc: 12, services: 15 },
    { day: "Wed", logins: 28, kyc: 6, services: 18 },
    { day: "Thu", logins: 35, kyc: 14, services: 22 },
    { day: "Fri", logins: 42, kyc: 18, services: 28 },
    { day: "Sat", logins: 18, kyc: 4, services: 10 },
    { day: "Sun", logins: 15, kyc: 3, services: 8 },
  ];

  const statCards = [
    {
      title: t('dashboard.totalUsers'),
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "+12.5%",
      trendUp: true,
      link: "/users",
    },
    {
      title: t('dashboard.pendingKyc'),
      value: stats?.pendingKyc || 0,
      icon: FileCheck,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      trend: "-3.2%",
      trendUp: false,
      link: "/kyc",
    },
    {
      title: t('dashboard.activeUsers'),
      value: stats?.activeUsers || 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: "+8.1%",
      trendUp: true,
      link: "/users",
    },
    {
      title: t('dashboard.activeSessions'),
      value: stats?.activeSessions || 0,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: "+15.3%",
      trendUp: true,
      link: "/logs",
    },
  ];

  const getActionTypeIcon = (type: string) => {
    if (type.includes('approve')) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (type.includes('reject')) return <XCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('nav.dashboard')}</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your system today.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </div>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-10 w-10 bg-muted rounded-lg"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, index) => (
              <Link key={index} href={card.link}>
                <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${card.bgColor} transition-transform group-hover:scale-110`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-bold">{card.value.toLocaleString()}</div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        card.trendUp ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.trendUp ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>{card.trend}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      vs last month
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Growth Chart */}
          <Card className="col-span-full lg:col-span-2">
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
              <CardDescription>Total registered users over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(45% 0.15 240)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="oklch(45% 0.15 240)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="oklch(45% 0.15 240)" 
                    strokeWidth={2}
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* KYC Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>KYC Status</CardTitle>
              <CardDescription>Current verification status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={kycStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {kycStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>User logins, KYC submissions, and service connections</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="logins" fill="#3b82f6" name="Logins" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kyc" fill="#f59e0b" name="KYC Submissions" radius={[4, 4, 0, 0]} />
                <Bar dataKey="services" fill="#10b981" name="Service Connections" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and actions</CardDescription>
            </div>
            <Link href="/logs">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t">
              <div className="max-h-[360px] overflow-auto">
                <div className="divide-y">
                  {(recentLogs ?? []).slice(0, 12).map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 px-6 py-4 hover:bg-muted/40 transition-colors">
                      <div className="mt-1 rounded-lg border bg-background p-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium truncate">{log.action}</p>
                          <Badge variant="secondary" className="shrink-0">
                            {log.actionType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {log.description || log.ipAddress || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.createdAt), "PPpp")}
                        </p>
                      </div>
                    </div>
                  ))}

                  {(!recentLogs || recentLogs.length === 0) && (
                    <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

{/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/kyc">
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <FileCheck className="h-5 w-5" />
                  Review KYC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {stats?.pendingKyc || 0} pending verification{stats?.pendingKyc !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/users">
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Users className="h-5 w-5" />
                  Manage Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {stats?.totalUsers || 0} total user{stats?.totalUsers !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/services">
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Activity className="h-5 w-5" />
                  Configure Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage connected services
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
