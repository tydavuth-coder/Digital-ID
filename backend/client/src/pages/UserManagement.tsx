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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  UserX,
  UserCheck,
  Clock,
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  User as UserIcon,
  Settings,
  Shield
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { User } from "../../../drizzle/schema";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { useLocation } from "wouter";

export default function UserManagement() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: users, isLoading, refetch } = trpc.users.getAll.useQuery();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      setEditingUser(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      setDeletingUserId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const bulkImportMutation = trpc.users.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.success} user(s)`);
      if (data.failed > 0) {
        toast.error(`Failed to import ${data.failed} user(s)`);
      }
      setShowImportDialog(false);
      setImportFile(null);
      setImportPreview([]);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingUser.id,
      data: {
        nameKhmer: formData.get('nameKhmer') as string,
        nameEnglish: formData.get('nameEnglish') as string,
        nationalId: formData.get('nationalId') as string,
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        gender: formData.get('gender') as "male" | "female" | "other",
        address: formData.get('address') as string,
        status: formData.get('status') as "active" | "pending" | "blocked",
      },
    });
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateMutation.mutateAsync({
        id: userId,
        data: {
          role: newRole as "user" | "admin" | "kyc_reviewer" | "system_admin" | "super_admin",
        },
      });
      toast.success(`Role updated to ${newRole.replace('_', ' ')}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update role');
    }
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
      blocked: UserX,
    };
    const Icon = icons[status] || Clock;
    return (
      <Badge variant={variants[status] || "default"} className="gap-1">
        <Icon className="h-3 w-3" />
        {t(`status.${status}`)}
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
      <Badge variant={variants[kycStatus] || "secondary"} className="text-xs">
        {kycStatus === "none" ? "No KYC" : kycStatus}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className: string }> = {
      user: { variant: "secondary", label: "User", className: "" },
      admin: { variant: "default", label: "Admin", className: "bg-blue-600" },
      kyc_reviewer: { variant: "outline", label: "KYC Reviewer", className: "border-green-500 text-green-600" },
      system_admin: { variant: "outline", label: "System Admin", className: "border-purple-500 text-purple-600" },
      super_admin: { variant: "default", label: "Super Admin", className: "bg-gradient-to-r from-amber-500 to-orange-500" },
    };
    const config = roleConfig[role] || roleConfig.user;
    return (
      <Badge variant={config.variant} className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        user.nameEnglish?.toLowerCase().includes(searchLower) ||
        user.nameKhmer?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.nationalId?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      // KYC filter
      const matchesKyc = kycFilter === "all" || user.kycStatus === kycFilter;

      return matchesSearch && matchesStatus && matchesKyc;
    });
  }, [users, searchQuery, statusFilter, kycFilter]);

  // Select all toggle
  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  // Toggle individual selection
  const toggleSelect = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Bulk actions
  const handleBulkStatusUpdate = async (status: "active" | "pending" | "blocked") => {
    if (selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }

    try {
      const userIds = Array.from(selectedUsers);
      for (const userId of userIds) {
        await updateMutation.mutateAsync({
          id: userId,
          data: { status },
        });
      }
      toast.success(`Updated ${selectedUsers.size} user(s)`);
      setSelectedUsers(new Set());
      refetch();
    } catch (error) {
      toast.error("Failed to update users");
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }
    toast.error("Bulk delete requires confirmation");
  };

  const exportToCSV = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      toast.error("No users to export");
      return;
    }

    const headers = ['ID', 'Name (Khmer)', 'Name (English)', 'National ID', 'Username', 'Email', 'Phone', 'Status', 'KYC Status', 'Created At'];
    const rows = filteredUsers.map(user => [
      user.id,
      user.nameKhmer || '-',
      user.nameEnglish || '-',
      user.nationalId || '-',
      user.username || '-',
      user.email || '-',
      user.phoneNumber || '-',
      user.status,
      user.kycStatus,
      format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Users exported successfully');
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Name English': 'John Doe',
        'Name Khmer': 'ចន ដូ',
        'National ID': '123456789',
        'Username': 'johndoe',
        'Email': 'john@example.com',
        'Phone': '+855123456789',
        'Gender': 'male',
        'Address': 'Phnom Penh',
        'Status': 'active',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'user_import_template.xlsx');
    toast.success('Template downloaded');
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setImportPreview(jsonData.slice(0, 5)); // Show first 5 rows
      } catch (error) {
        toast.error('Failed to read file');
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        handleFileUpload(file);
      } else {
        toast.error('Please upload an Excel or CSV file');
      }
    }
  };

  const handleImport = () => {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        // Map CSV columns to user data
        const users = jsonData.map((row: any) => ({
          nameKhmer: row['Name Khmer'] || row['nameKhmer'] || '',
          nameEnglish: row['Name English'] || row['nameEnglish'] || row['Name'] || '',
          nationalId: row['National ID'] || row['nationalId'] || '',
          username: row['Username'] || row['username'] || '',
          email: row['Email'] || row['email'] || '',
          phoneNumber: row['Phone'] || row['phoneNumber'] || '',
          gender: (row['Gender'] || row['gender'] || '').toLowerCase() as 'male' | 'female' | 'other' | undefined,
          address: row['Address'] || row['address'] || '',
          status: (row['Status'] || row['status'] || 'pending').toLowerCase() as 'active' | 'pending' | 'blocked',
        }));

        bulkImportMutation.mutate({ users });
      } catch (error) {
        toast.error('Failed to import users');
        console.error(error);
      }
    };
    reader.readAsBinaryString(importFile);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
            <p className="text-muted-foreground mt-1">
              Manage user accounts, permissions, and verification status
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowImportDialog(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Users
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, username, email, or National ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="none">No KYC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedUsers.size} user(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate("active")}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate("blocked")}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Block
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('users.title')}</span>
              <Badge variant="secondary">{filteredUsers.length} users</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No users found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>{t('users.id')}</TableHead>
                      <TableHead>{t('users.photo')}</TableHead>
                      <TableHead>{t('users.nameKhmer')}</TableHead>
                      <TableHead>{t('users.nameEnglish')}</TableHead>
                      <TableHead>{t('users.nationalId')}</TableHead>
                      <TableHead>{t('users.username')}</TableHead>
                      <TableHead>{t('users.email')}</TableHead>
                      <TableHead>{t('users.status')}</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>{t('users.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id}
                        className={selectedUsers.has(user.id) ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleSelect(user.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {user.nameEnglish?.charAt(0) || user.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>{user.nameKhmer || '-'}</TableCell>
                        <TableCell className="font-medium">{user.nameEnglish || '-'}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {user.nationalId || '-'}
                          </code>
                        </TableCell>
                        <TableCell>{user.username || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setLocation(`/user-profile?id=${user.id}`)}>
                                <UserIcon className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs text-muted-foreground">Change Role</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleRoleChange(user.id, 'user')}
                                disabled={user.role === 'user'}
                              >
                                <UserIcon className="h-4 w-4 mr-2" />
                                User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRoleChange(user.id, 'kyc_reviewer')}
                                disabled={user.role === 'kyc_reviewer'}
                              >
                                <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                                KYC Reviewer
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRoleChange(user.id, 'system_admin')}
                                disabled={user.role === 'system_admin'}
                              >
                                <Settings className="h-4 w-4 mr-2 text-purple-500" />
                                System Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRoleChange(user.id, 'super_admin')}
                                disabled={user.role === 'super_admin'}
                              >
                                <Shield className="h-4 w-4 mr-2 text-amber-500" />
                                Super Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingUserId(user.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('users.editUser')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nameKhmer">{t('users.nameKhmer')}</Label>
                    <Input
                      id="edit-nameKhmer"
                      name="nameKhmer"
                      defaultValue={editingUser?.nameKhmer || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nameEnglish">{t('users.nameEnglish')}</Label>
                    <Input
                      id="edit-nameEnglish"
                      name="nameEnglish"
                      defaultValue={editingUser?.nameEnglish || ''}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nationalId">{t('users.nationalId')}</Label>
                  <Input
                    id="edit-nationalId"
                    name="nationalId"
                    defaultValue={editingUser?.nationalId || ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-username">{t('users.username')}</Label>
                    <Input
                      id="edit-username"
                      name="username"
                      defaultValue={editingUser?.username || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">{t('users.email')}</Label>
                    <Input
                      id="edit-email"
                      name="email"
                      type="email"
                      defaultValue={editingUser?.email || ''}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phoneNumber">{t('users.phoneNumber')}</Label>
                    <Input
                      id="edit-phoneNumber"
                      name="phoneNumber"
                      defaultValue={editingUser?.phoneNumber || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-gender">{t('users.gender')}</Label>
                    <Select name="gender" defaultValue={editingUser?.gender || "other"}>
                      <SelectTrigger id="edit-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">{t('users.address')}</Label>
                  <Input
                    id="edit-address"
                    name="address"
                    defaultValue={editingUser?.address || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">{t('users.status')}</Label>
                  <Select name="status" defaultValue={editingUser?.status || "pending"}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Import Users Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Users
              </DialogTitle>
              <DialogDescription>
                Upload an Excel or CSV file to bulk import users. Download the template to see the required format.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Download Template</p>
                    <p className="text-sm text-muted-foreground">Get the Excel template with example data</p>
                  </div>
                </div>
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {importFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="h-12 w-12 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{importFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(importFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setImportFile(null);
                          setImportPreview([]);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Drag and drop your file here</p>
                      <p className="text-sm text-muted-foreground mt-1">or</p>
                    </div>
                    <label htmlFor="file-upload">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </span>
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">Supports: .xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <p className="font-medium">Preview (First 5 rows)</p>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left">Name (English)</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">National ID</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row: any, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2">
                                {row['Name English'] || row['nameEnglish'] || row['Name'] || '-'}
                              </td>
                              <td className="px-4 py-2">{row['Email'] || row['email'] || '-'}</td>
                              <td className="px-4 py-2">
                                {row['National ID'] || row['nationalId'] || '-'}
                              </td>
                              <td className="px-4 py-2">
                                {row['Status'] || row['status'] || 'pending'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total rows in file: {importPreview.length > 0 ? 'Multiple' : '0'}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                  setImportPreview([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!importFile || bulkImportMutation.isPending}
              >
                {bulkImportMutation.isPending ? 'Importing...' : 'Import Users'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingUserId} onOpenChange={() => setDeletingUserId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('users.deleteUser')}</DialogTitle>
              <DialogDescription>{t('users.deleteConfirm')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingUserId(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingUserId) {
                    deleteMutation.mutate({ id: deletingUserId });
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
