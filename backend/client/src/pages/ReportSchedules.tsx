import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  Mail, 
  MoreHorizontal, 
  Play, 
  Plus, 
  Trash2, 
  Edit, 
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function ReportSchedules() {
  const { t } = useLanguage();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    reportType: "monthly" as "monthly" | "quarterly" | "weekly" | "custom",
    frequency: "monthly" as "daily" | "weekly" | "monthly" | "quarterly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    timeOfDay: "09:00",
    recipientEmails: [""],
    isEnabled: true,
  });

  const schedulesQuery = trpc.reportSchedules.getAll.useQuery();
  const createMutation = trpc.reportSchedules.create.useMutation({
    onSuccess: () => {
      toast.success("Report schedule created successfully");
      setIsCreateOpen(false);
      resetForm();
      schedulesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create schedule");
    },
  });

  const updateMutation = trpc.reportSchedules.update.useMutation({
    onSuccess: () => {
      toast.success("Report schedule updated successfully");
      setIsEditOpen(false);
      setSelectedSchedule(null);
      schedulesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update schedule");
    },
  });

  const deleteMutation = trpc.reportSchedules.delete.useMutation({
    onSuccess: () => {
      toast.success("Report schedule deleted successfully");
      schedulesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete schedule");
    },
  });

  const toggleMutation = trpc.reportSchedules.toggle.useMutation({
    onSuccess: () => {
      toast.success("Schedule status updated");
      schedulesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const runNowMutation = trpc.reportSchedules.runNow.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Report sent successfully");
      schedulesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to run report");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      reportType: "monthly",
      frequency: "monthly",
      dayOfWeek: 1,
      dayOfMonth: 1,
      timeOfDay: "09:00",
      recipientEmails: [""],
      isEnabled: true,
    });
  };

  const handleCreate = () => {
    const validEmails = formData.recipientEmails.filter(email => email.trim() !== "");
    if (validEmails.length === 0) {
      toast.error("Please add at least one recipient email");
      return;
    }
    
    createMutation.mutate({
      name: formData.name,
      reportType: formData.reportType,
      frequency: formData.frequency,
      dayOfWeek: formData.frequency === "weekly" ? formData.dayOfWeek : undefined,
      dayOfMonth: ["monthly", "quarterly"].includes(formData.frequency) ? formData.dayOfMonth : undefined,
      timeOfDay: formData.timeOfDay,
      recipientEmails: validEmails,
      isEnabled: formData.isEnabled,
    });
  };

  const handleEdit = () => {
    if (!selectedSchedule) return;
    
    const validEmails = formData.recipientEmails.filter(email => email.trim() !== "");
    if (validEmails.length === 0) {
      toast.error("Please add at least one recipient email");
      return;
    }
    
    updateMutation.mutate({
      id: selectedSchedule.id,
      data: {
        name: formData.name,
        reportType: formData.reportType,
        frequency: formData.frequency,
        dayOfWeek: formData.frequency === "weekly" ? formData.dayOfWeek : null,
        dayOfMonth: ["monthly", "quarterly"].includes(formData.frequency) ? formData.dayOfMonth : null,
        timeOfDay: formData.timeOfDay,
        recipientEmails: validEmails,
        isEnabled: formData.isEnabled,
      },
    });
  };

  const openEditDialog = (schedule: any) => {
    setSelectedSchedule(schedule);
    let emails: string[];
    try {
      emails = JSON.parse(schedule.recipientEmails);
    } catch {
      emails = [schedule.recipientEmails];
    }
    
    setFormData({
      name: schedule.name,
      reportType: schedule.reportType,
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek || 1,
      dayOfMonth: schedule.dayOfMonth || 1,
      timeOfDay: schedule.timeOfDay || "09:00",
      recipientEmails: emails.length > 0 ? emails : [""],
      isEnabled: schedule.isEnabled,
    });
    setIsEditOpen(true);
  };

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      recipientEmails: [...prev.recipientEmails, ""],
    }));
  };

  const removeEmailField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipientEmails: prev.recipientEmails.filter((_, i) => i !== index),
    }));
  };

  const updateEmail = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipientEmails: prev.recipientEmails.map((email, i) => i === index ? value : email),
    }));
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily": return "Daily";
      case "weekly": return "Weekly";
      case "monthly": return "Monthly";
      case "quarterly": return "Quarterly";
      default: return frequency;
    }
  };

  const getDayLabel = (schedule: any) => {
    if (schedule.frequency === "weekly") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return days[schedule.dayOfWeek] || "Monday";
    }
    if (["monthly", "quarterly"].includes(schedule.frequency)) {
      return `Day ${schedule.dayOfMonth || 1}`;
    }
    return "";
  };

  const schedules = schedulesQuery.data || [];

  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Schedule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Monthly Performance Report"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select
            value={formData.reportType}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, reportType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.frequency === "weekly" && (
        <div className="space-y-2">
          <Label>Day of Week</Label>
          <Select
            value={formData.dayOfWeek.toString()}
            onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="2">Tuesday</SelectItem>
              <SelectItem value="3">Wednesday</SelectItem>
              <SelectItem value="4">Thursday</SelectItem>
              <SelectItem value="5">Friday</SelectItem>
              <SelectItem value="6">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {["monthly", "quarterly"].includes(formData.frequency) && (
        <div className="space-y-2">
          <Label>Day of Month</Label>
          <Select
            value={formData.dayOfMonth.toString()}
            onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(value) }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Time of Day</Label>
        <Input
          type="time"
          value={formData.timeOfDay}
          onChange={(e) => setFormData(prev => ({ ...prev, timeOfDay: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Recipient Emails</Label>
        {formData.recipientEmails.map((email, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              placeholder="email@example.com"
            />
            {formData.recipientEmails.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeEmailField(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addEmailField}>
          <Plus className="h-4 w-4 mr-1" /> Add Email
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.isEnabled}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
        />
        <Label htmlFor="enabled">Enable schedule</Label>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Report Schedules</h1>
            <p className="text-gray-500 mt-1">
              Configure automated report generation and delivery
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Report Schedule</DialogTitle>
                <DialogDescription>
                  Set up automated report generation and email delivery
                </DialogDescription>
              </DialogHeader>
              {renderForm()}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Schedules</p>
                  <p className="text-2xl font-bold">{schedules.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold">{schedules.filter(s => s.isEnabled).length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Paused</p>
                  <p className="text-2xl font-bold">{schedules.filter(s => !s.isEnabled).length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Failed</p>
                  <p className="text-2xl font-bold">{schedules.filter(s => s.lastStatus === "failed").length}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>
              Manage your automated report schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No schedules yet</h3>
                <p className="text-gray-500 mt-1">Create your first report schedule to automate report delivery</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => {
                    let recipientCount = 0;
                    try {
                      recipientCount = JSON.parse(schedule.recipientEmails).length;
                    } catch {
                      recipientCount = 1;
                    }
                    
                    return (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">{schedule.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {schedule.reportType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{getFrequencyLabel(schedule.frequency)}</span>
                            <span className="text-xs text-gray-500">{getDayLabel(schedule)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {schedule.timeOfDay || "09:00"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={schedule.isEnabled}
                              onCheckedChange={(checked) => toggleMutation.mutate({ id: schedule.id, isEnabled: checked })}
                            />
                            {getStatusBadge(schedule.lastStatus)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {schedule.lastRunAt 
                            ? new Date(schedule.lastRunAt).toLocaleDateString()
                            : "Never"
                          }
                        </TableCell>
                        <TableCell>
                          {schedule.nextRunAt 
                            ? new Date(schedule.nextRunAt).toLocaleDateString()
                            : "N/A"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => runNowMutation.mutate({ id: schedule.id })}
                                disabled={runNowMutation.isPending}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Run Now
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(schedule)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteMutation.mutate({ id: schedule.id })}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Report Schedule</DialogTitle>
              <DialogDescription>
                Update the schedule configuration
              </DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
