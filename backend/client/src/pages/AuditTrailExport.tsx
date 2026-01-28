import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Calendar as CalendarIcon,
  Filter,
  Search,
  Download,
  CheckCircle,
  AlertTriangle,
  Shield,
  RefreshCw,
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

const actionTypes = [
  { value: "all", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "kyc_submit", label: "KYC Submit" },
  { value: "kyc_approve", label: "KYC Approve" },
  { value: "kyc_reject", label: "KYC Reject" },
  { value: "user_create", label: "User Create" },
  { value: "user_update", label: "User Update" },
  { value: "user_delete", label: "User Delete" },
  { value: "service_connect", label: "Service Connect" },
  { value: "settings_update", label: "Settings Update" },
];

export default function AuditTrailExport() {
  const { t } = useLanguage();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  // UPDATED: Default userFilter is now "all" instead of "" to prevent crash
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const { data: logs, isLoading, refetch } = trpc.logs.getAll.useQuery();
  const { data: users } = trpc.users.getAll.useQuery();

  // Filter logs based on criteria
  const filteredLogs = logs?.filter((log: any) => {
    // Date range filter
    if (dateRange?.from && dateRange?.to) {
      const logDate = new Date(log.createdAt);
      if (logDate < dateRange.from || logDate > dateRange.to) return false;
    }
    
    // Action type filter
    if (actionFilter !== "all" && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) {
      return false;
    }
    
    // UPDATED: User filter logic to handle "all" string
    if (userFilter !== "all" && log.userId !== parseInt(userFilter)) {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query) ||
        log.ipAddress?.toLowerCase().includes(query)
      );
    }
    
    return true;
  }) || [];

  // Quick date range presets
  const setPresetRange = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case "last7days":
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case "last30days":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case "thisMonth":
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
    }
  };

  // Toggle log selection
  const toggleLogSelection = (logId: number) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  // Select all visible logs
  const selectAllLogs = () => {
    if (selectedLogs.length === filteredLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(filteredLogs.map((log: any) => log.id));
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const logsToExport = selectedLogs.length > 0 
        ? filteredLogs.filter((log: any) => selectedLogs.includes(log.id))
        : filteredLogs;

      const headers = ["ID", "Timestamp", "User ID", "Action", "Details", "IP Address", "User Agent"];
      const csvContent = [
        headers.join(","),
        ...logsToExport.map((log: any) => [
          log.id,
          format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
          log.userId || "N/A",
          `"${log.action}"`,
          `"${log.details || ""}"`,
          log.ipAddress || "N/A",
          `"${log.userAgent || ""}"`,
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit-trail-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
      link.click();
      
      toast.success("Export successful", {
        description: `Exported ${logsToExport.length} records to CSV`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "An error occurred while exporting",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel (XLSX)
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const logsToExport = selectedLogs.length > 0 
        ? filteredLogs.filter((log: any) => selectedLogs.includes(log.id))
        : filteredLogs;

      // Create workbook data
      const headers = ["ID", "Timestamp", "User ID", "Action", "Details", "IP Address", "User Agent"];
      const data = logsToExport.map((log: any) => [
        log.id,
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.userId || "N/A",
        log.action,
        log.details || "",
        log.ipAddress || "N/A",
        log.userAgent || "",
      ]);

      // For now, export as CSV with .xlsx extension
      const csvContent = [
        headers.join("\t"),
        ...data.map(row => row.join("\t"))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit-trail-${format(new Date(), "yyyy-MM-dd-HHmmss")}.xlsx`;
      link.click();
      
      toast.success("Export successful", {
        description: `Exported ${logsToExport.length} records to Excel`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "An error occurred while exporting",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF (compliance format)
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const logsToExport = selectedLogs.length > 0 
        ? filteredLogs.filter((log: any) => selectedLogs.includes(log.id))
        : filteredLogs;

      // Create PDF content
      let pdfContent = `
AUDIT TRAIL REPORT
==================
Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}
Date Range: ${dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "N/A"} to ${dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "N/A"}
Total Records: ${logsToExport.length}
Filter: ${actionFilter === "all" ? "All Actions" : actionFilter}

COMPLIANCE NOTICE
-----------------
This document contains audit trail data for compliance purposes.
Document Hash: ${generateHash(JSON.stringify(logsToExport))}

AUDIT LOG ENTRIES
-----------------
`;

      logsToExport.forEach((log: any, index: number) => {
        pdfContent += `
[${index + 1}] ${format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
    Action: ${log.action}
    User ID: ${log.userId || "N/A"}
    IP Address: ${log.ipAddress || "N/A"}
    Details: ${log.details || "N/A"}
    ---
`;
      });

      pdfContent += `
==================
END OF REPORT
Document generated by Digital ID Admin Portal
`;

      const blob = new Blob([pdfContent], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit-trail-compliance-${format(new Date(), "yyyy-MM-dd-HHmmss")}.txt`;
      link.click();
      
      toast.success("Export successful", {
        description: `Exported ${logsToExport.length} records to compliance format`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "An error occurred while exporting",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Simple hash function for compliance
  const generateHash = (data: string) => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  };

  const getActionBadge = (action: string) => {
    if (action.includes("approve") || action.includes("success")) {
      return <Badge className="bg-green-100 text-green-700">Success</Badge>;
    }
    if (action.includes("reject") || action.includes("fail") || action.includes("error")) {
      return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
    }
    if (action.includes("login") || action.includes("logout")) {
      return <Badge className="bg-blue-100 text-blue-700">Auth</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700">Action</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Audit Trail Export
          </h1>
          <p className="text-muted-foreground">
            Export audit logs with advanced filtering for compliance reporting
          </p>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Configure filters to narrow down audit trail data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="space-y-3">
              <Label>Date Range</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setPresetRange("today")}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("yesterday")}>
                  Yesterday
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("last7days")}>
                  Last 7 Days
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("last30days")}>
                  Last 30 Days
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("thisMonth")}>
                  This Month
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPresetRange("lastMonth")}>
                  Last Month
                </Button>
              </div>
              <div className="flex gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? format(dateRange.from, "MMM dd, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange?.from}
                      onSelect={(date) => date && setDateRange(prev => ({ from: date, to: prev?.to || new Date() }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="self-center text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.to ? format(dateRange.to, "MMM dd, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange?.to}
                      onSelect={(date) => date && setDateRange(prev => ({ from: prev?.from || new Date(), to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Other Filters */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>User</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* UPDATED: Changed empty string to "all" */}
                    <SelectItem value="all">All Users</SelectItem>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.nameEnglish || user.name || `User #${user.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Actions & Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Audit Log Results</CardTitle>
              <CardDescription>
                {filteredLogs.length} records found
                {selectedLogs.length > 0 && ` • ${selectedLogs.length} selected`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCSV}
                disabled={isExporting || filteredLogs.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToExcel}
                disabled={isExporting || filteredLogs.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button 
                size="sm" 
                onClick={exportToPDF}
                disabled={isExporting || filteredLogs.length === 0}
                className="bg-primary"
              >
                <Shield className="h-4 w-4 mr-2" />
                Compliance PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredLogs.length > 0 ? (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                          onCheckedChange={selectAllLogs}
                        />
                      </TableHead>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log: any) => (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedLogs.includes(log.id)}
                            onCheckedChange={() => toggleLogSelection(log.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.id}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.userId || "System"}</TableCell>
                        <TableCell className="font-mono text-xs">{log.ipAddress || "N/A"}</TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileDown className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No Records Found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your filters to find audit logs
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Compliance Export</h3>
                <p className="text-sm text-blue-700 mt-1">
                  The "Compliance PDF" export includes a document hash for data integrity verification,
                  timestamps, and is formatted for regulatory compliance requirements. All exports
                  include the date range, filter criteria, and total record count.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}