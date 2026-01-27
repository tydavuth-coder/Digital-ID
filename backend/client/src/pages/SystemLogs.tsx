import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Download, Trash2, Filter, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo } from "react";

export default function SystemLogs() {
  const { t } = useLanguage();
  const { data: logs, isLoading, refetch } = trpc.logs.getAll.useQuery();
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const clearMutation = trpc.logs.clear.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      setIsClearDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const exportToExcel = () => {
    if (!logs || logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    // Create CSV content
    const headers = ['ID', 'User', 'Action', 'Type', 'Description', 'Timestamp'];
    const rows = logs.map(log => [
      log.id,
      log.username || '-',
      log.action,
      log.actionType,
      log.description || '-',
      format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `system-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Logs exported successfully');
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs.filter((log) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        log.action.toLowerCase().includes(searchLower) ||
        log.username?.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower);

      const matchesType = typeFilter === "all" || log.actionType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [logs, searchQuery, typeFilter]);

  const getActionTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      login: "default",
      logout: "secondary",
      kyc_submit: "outline",
      kyc_approve: "default",
      kyc_reject: "destructive",
      service_connect: "default",
      service_disconnect: "secondary",
      qr_scan: "outline",
      profile_update: "outline",
      admin_action: "default",
      other: "secondary",
    };
    return (
      <Badge variant={variants[type] || "secondary"}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('logs.title')}</h1>
            <p className="text-muted-foreground mt-1">
              Track all system activities and user actions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              {t('logs.exportExcel')}
            </Button>
            <Button variant="destructive" onClick={() => setIsClearDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('logs.clearLogs')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs by action, user, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="kyc_submit">KYC Submit</SelectItem>
                  <SelectItem value="kyc_approve">KYC Approve</SelectItem>
                  <SelectItem value="kyc_reject">KYC Reject</SelectItem>
                  <SelectItem value="service_connect">Service Connect</SelectItem>
                  <SelectItem value="service_disconnect">Service Disconnect</SelectItem>
                  <SelectItem value="qr_scan">QR Scan</SelectItem>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                  <SelectItem value="admin_action">Admin Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('logs.title')}</span>
              <Badge variant="secondary">{filteredLogs.length} logs</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('users.id')}</TableHead>
                      <TableHead>{t('logs.user')}</TableHead>
                      <TableHead>{t('logs.action')}</TableHead>
                      <TableHead>{t('logs.type')}</TableHead>
                      <TableHead>{t('logs.description')}</TableHead>
                      <TableHead>{t('logs.timestamp')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                          <p className="text-muted-foreground">No logs found</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Try adjusting your search or filters
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>{log.username || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.action}</TableCell>
                        <TableCell>{getActionTypeBadge(log.actionType)}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.description || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clear Confirmation Dialog */}
        <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('logs.clearLogs')}</DialogTitle>
              <DialogDescription>{t('logs.clearConfirm')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
              >
                {t('common.clear')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
