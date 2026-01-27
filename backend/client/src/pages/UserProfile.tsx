import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  LogIn,
  FileCheck,
  Link as LinkIcon,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [actionFilter, setActionFilter] = useState<string>("all");

  // Get user ID from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const userId = parseInt(urlParams.get("id") || "0");

  const { data: users } = trpc.users.getAll.useQuery();
  const { data: activityLogs } = trpc.logs.getAll.useQuery();

  const user = users?.find((u) => u.id === userId);
  const userLogs = activityLogs?.filter((log) => log.userId === userId) || [];

  // Filter logs by action type
  const filteredLogs =
    actionFilter === "all"
      ? userLogs
      : userLogs.filter((log) => log.actionType === actionFilter);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium">User not found</p>
            <Button className="mt-4" onClick={() => setLocation("/users")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, any> = {
      login: LogIn,
      logout: LogIn,
      kyc_submit: FileCheck,
      kyc_approve: CheckCircle,
      kyc_reject: XCircle,
      service_connect: LinkIcon,
      service_disconnect: LinkIcon,
      qr_scan: Activity,
      profile_update: Settings,
      admin_action: Shield,
    };
    return icons[actionType] || Activity;
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      login: "text-blue-500",
      logout: "text-gray-500",
      kyc_submit: "text-yellow-500",
      kyc_approve: "text-green-500",
      kyc_reject: "text-red-500",
      service_connect: "text-purple-500",
      service_disconnect: "text-orange-500",
      qr_scan: "text-cyan-500",
      profile_update: "text-indigo-500",
      admin_action: "text-pink-500",
    };
    return colors[actionType] || "text-gray-500";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      pending: "secondary",
      blocked: "destructive",
    };
    const icons: Record<string, any> = {
      active: UserCheck,
      pending: Clock,
      blocked: XCircle,
    };
    const Icon = icons[status] || Clock;
    return (
      <Badge variant={variants[status] || "default"} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getKycBadge = (kycStatus: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      none: "secondary",
    };
    return (
      <Badge variant={variants[kycStatus] || "secondary"}>
        {kycStatus === "none" ? "No KYC" : kycStatus}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
            <p className="text-muted-foreground mt-1">
              View detailed information and activity history
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.photoUrl || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user.nameEnglish?.charAt(0) || user.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{user.nameEnglish || "No Name"}</h2>
                    {user.nameKhmer && (
                      <p className="text-lg text-muted-foreground">{user.nameKhmer}</p>
                    )}
                    <div className="flex gap-2 justify-center">
                      {getStatusBadge(user.status)}
                      {getKycBadge(user.kycStatus)}
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-medium">{user.id}</span>
                  </div>

                  {user.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium break-all">{user.email}</span>
                    </div>
                  )}

                  {user.phoneNumber && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{user.phoneNumber}</span>
                    </div>
                  )}

                  {user.nationalId && (
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">National ID:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {user.nationalId}
                      </code>
                    </div>
                  )}

                  {user.address && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium">{user.address}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Login:</span>
                    <span className="font-medium">
                      {format(new Date(user.lastSignedIn), "MMM dd, yyyy HH:mm")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Actions</span>
                  <span className="text-2xl font-bold">{userLogs.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Login Count</span>
                  <span className="text-lg font-semibold">
                    {userLogs.filter((log) => log.actionType === "login").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">KYC Submissions</span>
                  <span className="text-lg font-semibold">
                    {userLogs.filter((log) => log.actionType === "kyc_submit").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Service Connections</span>
                  <span className="text-lg font-semibold">
                    {userLogs.filter((log) => log.actionType === "service_connect").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Timeline
                  </CardTitle>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="kyc_submit">KYC Submission</SelectItem>
                      <SelectItem value="kyc_approve">KYC Approval</SelectItem>
                      <SelectItem value="kyc_reject">KYC Rejection</SelectItem>
                      <SelectItem value="service_connect">Service Connection</SelectItem>
                      <SelectItem value="service_disconnect">Service Disconnect</SelectItem>
                      <SelectItem value="profile_update">Profile Update</SelectItem>
                      <SelectItem value="admin_action">Admin Action</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground">No activity found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLogs.map((log, index) => {
                      const Icon = getActionIcon(log.actionType);
                      const colorClass = getActionColor(log.actionType);

                      return (
                        <div key={log.id} className="relative">
                          {/* Timeline Line */}
                          {index !== filteredLogs.length - 1 && (
                            <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
                          )}

                          {/* Timeline Item */}
                          <div className="flex gap-4">
                            <div
                              className={`flex-shrink-0 w-12 h-12 rounded-full bg-background border-2 flex items-center justify-center ${colorClass}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 pb-8">
                              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <p className="font-medium">{log.action}</p>
                                    {log.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {log.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                                    {log.actionType.replace("_", " ")}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(log.createdAt), "MMM dd, yyyy 'at' HH:mm:ss")}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
