import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AnalyticsReports() {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState<"monthly" | "quarterly">("monthly");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Digital-ID-Report-${reportType}-${dateRange.start}-to-${dateRange.end}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Report generated and downloaded successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error("Please select both start and end dates");
      return;
    }

    generateMutation.mutate({
      reportType,
      startDate: dateRange.start,
      endDate: dateRange.end,
    });
  };

  const presetRanges = [
    {
      label: "Last Month",
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end: new Date(),
    },
    {
      label: "Last 3 Months",
      start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      end: new Date(),
    },
    {
      label: "Last 6 Months",
      start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      end: new Date(),
    },
    {
      label: "This Year",
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Analytics Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate comprehensive PDF reports with charts and statistics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type */}
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={reportType}
                  onValueChange={(value: "monthly" | "quarterly") => setReportType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="quarterly">Quarterly Report</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the type of report to generate
                </p>
              </div>

              {/* Date Range */}
              <div className="space-y-4">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm text-muted-foreground">
                      Start Date
                    </Label>
                    <input
                      id="start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, start: e.target.value }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm text-muted-foreground">
                      End Date
                    </Label>
                    <input
                      id="end-date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, end: e.target.value }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Preset Ranges */}
              <div className="space-y-2">
                <Label>Quick Select</Label>
                <div className="grid grid-cols-2 gap-2">
                  {presetRanges.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDateRange({
                          start: preset.start.toISOString().split("T")[0],
                          end: preset.end.toISOString().split("T")[0],
                        })
                      }
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate & Download PDF Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Contents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium text-sm">Executive Summary</p>
                    <p className="text-xs text-muted-foreground">
                      Total users, KYC stats, active sessions
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium text-sm">User Growth Trends</p>
                    <p className="text-xs text-muted-foreground">
                      Visual charts showing user registration trends
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium text-sm">KYC Verification</p>
                    <p className="text-xs text-muted-foreground">
                      Approval rates and verification statistics
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium text-sm">Service Usage</p>
                    <p className="text-xs text-muted-foreground">
                      Connected services and usage metrics
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium text-sm">Recent Users</p>
                    <p className="text-xs text-muted-foreground">
                      List of recently registered users
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Reports are generated in PDF format with professional
                  formatting, charts, and tables for easy sharing with stakeholders.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-primary/5 rounded flex items-center justify-center">
                  <FileText className="h-16 w-16 text-primary/50" />
                </div>
                <p className="text-sm font-medium text-center">Executive Summary</p>
                <p className="text-xs text-muted-foreground text-center">
                  Statistics cards and key metrics
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="aspect-[3/4] bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded flex items-center justify-center">
                  <TrendingUp className="h-16 w-16 text-blue-500/50" />
                </div>
                <p className="text-sm font-medium text-center">Growth Charts</p>
                <p className="text-xs text-muted-foreground text-center">
                  Visual bar charts and trend lines
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="aspect-[3/4] bg-gradient-to-br from-green-500/10 to-green-500/5 rounded flex items-center justify-center">
                  <FileText className="h-16 w-16 text-green-500/50" />
                </div>
                <p className="text-sm font-medium text-center">Detailed Tables</p>
                <p className="text-xs text-muted-foreground text-center">
                  KYC stats and user listings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
