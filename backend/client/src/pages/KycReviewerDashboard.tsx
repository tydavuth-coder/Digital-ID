import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";

export default function KycReviewerDashboard() {
  const { t } = useLanguage();
  
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();
  const { data: pendingKyc, isLoading: kycLoading } = trpc.kyc.getPending.useQuery();
  const { data: recentActivity, isLoading: activityLoading } = trpc.logs.getAll.useQuery();

  // Calculate KYC metrics
  const pendingCount = stats?.pendingKyc || 0;
  const approvedToday = 0; // Would come from stats
  const rejectedToday = 0; // Would come from stats
  const avgReviewTime = "2.5 hrs"; // Would come from stats

  return (
    <DashboardLayout title="KYC Reviewer">
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          KYC Reviewer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Review and verify pending KYC submissions
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{pendingCount}</span>
                {pendingCount > 10 && (
                  <Badge variant="destructive" className="text-xs">High</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{approvedToday}</span>
                <span className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected Today
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{rejectedToday}</span>
                <span className="text-xs text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -5%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Review Time
            </CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{avgReviewTime}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending KYC Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Verification Queue</CardTitle>
              <CardDescription>
                {pendingCount} submissions waiting for review
              </CardDescription>
            </div>
            <Link href="/kyc">
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {kycLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : pendingKyc && pendingKyc.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {pendingKyc.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.photoUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(user.nameEnglish || user.name || "U").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.nameEnglish || user.name || "Unknown"}
                        </p>
                        {user.nameKhmer && (
                          <p className="text-sm text-muted-foreground truncate font-khmer">
                            {user.nameKhmer}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Submitted {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Pending
                        </Badge>
                        <Link href={`/kyc?review=${user.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="font-semibold text-lg">All Caught Up!</h3>
                <p className="text-muted-foreground text-sm">
                  No pending KYC submissions to review
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity & Tips */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div className={`mt-1 h-2 w-2 rounded-full ${
                        log.action.includes('approve') ? 'bg-green-500' :
                        log.action.includes('reject') ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>

          {/* Review Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                Review Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• Verify photo matches ID document</p>
              <p>• Check document expiry date</p>
              <p>• Ensure all text is legible</p>
              <p>• Confirm selfie shows face clearly</p>
              <p>• Report suspicious documents</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
