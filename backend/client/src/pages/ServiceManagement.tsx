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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, RefreshCw, Copy, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Service } from "../../../drizzle/schema";

export default function ServiceManagement() {
  const { t } = useLanguage();
  const { data: services, isLoading, refetch } = trpc.services.getAll.useQuery();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const [visibleCredentials, setVisibleCredentials] = useState<Set<number>>(new Set());

  const createMutation = trpc.services.create.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.services.update.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      setEditingService(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.services.delete.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      setDeletingServiceId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const regenerateMutation = trpc.services.regenerateCredentials.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      nameKhmer: formData.get('nameKhmer') as string,
      nameEnglish: formData.get('nameEnglish') as string,
      description: formData.get('description') as string,
      logoUrl: formData.get('logoUrl') as string,
      callbackUrl: formData.get('callbackUrl') as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingService) return;

    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingService.id,
      data: {
        name: formData.get('name') as string,
        nameKhmer: formData.get('nameKhmer') as string,
        nameEnglish: formData.get('nameEnglish') as string,
        description: formData.get('description') as string,
        logoUrl: formData.get('logoUrl') as string,
        callbackUrl: formData.get('callbackUrl') as string,
        isActive: formData.get('isActive') === 'true',
      },
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`, {
      icon: <CheckCircle2 className="h-4 w-4" />,
    });
  };

  const toggleCredentialVisibility = (serviceId: number) => {
    const newVisible = new Set(visibleCredentials);
    if (newVisible.has(serviceId)) {
      newVisible.delete(serviceId);
    } else {
      newVisible.add(serviceId);
    }
    setVisibleCredentials(newVisible);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t('services.title')}</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('services.addService')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('services.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('users.id')}</TableHead>
                      <TableHead>{t('services.logo')}</TableHead>
                      <TableHead>{t('services.name')}</TableHead>
                      <TableHead>{t('services.token')}</TableHead>
                      <TableHead>{t('services.secret')}</TableHead>
                      <TableHead>{t('services.isActive')}</TableHead>
                      <TableHead>{t('users.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services?.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.id}</TableCell>
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={service.logoUrl || undefined} />
                            <AvatarFallback>
                              {service.name?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {service.nameKhmer || service.nameEnglish}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {visibleCredentials.has(service.id) 
                                ? service.token 
                                : '•'.repeat(32)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleCredentialVisibility(service.id)}
                            >
                              {visibleCredentials.has(service.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(service.token, 'Token')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {visibleCredentials.has(service.id) 
                                ? service.secret 
                                : '•'.repeat(32)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleCredentialVisibility(service.id)}
                            >
                              {visibleCredentials.has(service.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(service.secret, 'Secret')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? t('services.isActive') : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingService(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => regenerateMutation.mutate({ id: service.id })}
                              disabled={regenerateMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingServiceId(service.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('services.addService')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('services.name')}</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameKhmer">{t('services.nameKhmer')}</Label>
                    <Input id="nameKhmer" name="nameKhmer" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameEnglish">{t('services.nameEnglish')}</Label>
                    <Input id="nameEnglish" name="nameEnglish" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('services.description')}</Label>
                  <Textarea id="description" name="description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">{t('services.logo')} URL</Label>
                  <Input id="logoUrl" name="logoUrl" type="url" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callbackUrl">{t('services.callbackUrl')}</Label>
                  <Input id="callbackUrl" name="callbackUrl" type="url" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {t('common.add')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('services.editService')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('services.name')}</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingService?.name || ''}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nameKhmer">{t('services.nameKhmer')}</Label>
                    <Input
                      id="edit-nameKhmer"
                      name="nameKhmer"
                      defaultValue={editingService?.nameKhmer || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nameEnglish">{t('services.nameEnglish')}</Label>
                    <Input
                      id="edit-nameEnglish"
                      name="nameEnglish"
                      defaultValue={editingService?.nameEnglish || ''}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">{t('services.description')}</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingService?.description || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-logoUrl">{t('services.logo')} URL</Label>
                  <Input
                    id="edit-logoUrl"
                    name="logoUrl"
                    type="url"
                    defaultValue={editingService?.logoUrl || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-callbackUrl">{t('services.callbackUrl')}</Label>
                  <Input
                    id="edit-callbackUrl"
                    name="callbackUrl"
                    type="url"
                    defaultValue={editingService?.callbackUrl || ''}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    name="isActive"
                    defaultChecked={editingService?.isActive}
                    value={editingService?.isActive ? 'true' : 'false'}
                  />
                  <Label htmlFor="edit-isActive">{t('services.isActive')}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingService(null)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingServiceId} onOpenChange={() => setDeletingServiceId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('services.deleteService')}</DialogTitle>
              <DialogDescription>{t('services.deleteConfirm')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingServiceId(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingServiceId) {
                    deleteMutation.mutate({ id: deletingServiceId });
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
