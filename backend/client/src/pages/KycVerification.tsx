import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  FileCheck, 
  X, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

// Rejection reason templates
const REJECTION_TEMPLATES = [
  "Document is blurry or unclear",
  "Document appears to be tampered or edited",
  "Selfie does not match ID photo",
  "ID document has expired",
  "Document type not accepted",
  "Photo quality is too low",
  "ID information is not fully visible",
];

export default function KycVerification() {
  const { t } = useLanguage();
  const { data: kycList, isLoading, refetch } = trpc.kyc.getPending.useQuery();
  const [viewingKyc, setViewingKyc] = useState<any | null>(null);
  const [rejectingKycId, setRejectingKycId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [selectedKycs, setSelectedKycs] = useState<Set<number>>(new Set());

  const bulkApproveMutation = trpc.kyc.bulkApprove.useMutation({
    onSuccess: (data) => {
      toast.success(`Approved ${data.success} KYC document(s)`);
      setSelectedKycs(new Set());
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const bulkRejectMutation = trpc.kyc.bulkReject.useMutation({
    onSuccess: (data) => {
      toast.success(`Rejected ${data.success} KYC document(s)`);
      setSelectedKycs(new Set());
      setRejectingKycId(null);
      setRejectionReason('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const approveMutation = trpc.kyc.approve.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      setViewingKyc(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = trpc.kyc.reject.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      setRejectingKycId(null);
      setRejectionReason('');
      setViewingKyc(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id });
  };

  const handleReject = () => {
    if (!rejectingKycId || !rejectionReason.trim()) {
      toast.error(t('kyc.enterReason'));
      return;
    }
    rejectMutation.mutate({ id: rejectingKycId, reason: rejectionReason });
  };

  const handleZoomImage = (imageUrl: string) => {
    setZoomedImage(imageUrl);
    setImageRotation(0);
    setImageZoom(1);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    toast.success('Download started');
  };

  const toggleSelectAll = () => {
    if (selectedKycs.size === (kycList?.length || 0)) {
      setSelectedKycs(new Set());
    } else {
      setSelectedKycs(new Set(kycList?.map(item => item.kycDoc.id) || []));
    }
  };

  const toggleSelect = (kycId: number) => {
    const newSelected = new Set(selectedKycs);
    if (newSelected.has(kycId)) {
      newSelected.delete(kycId);
    } else {
      newSelected.add(kycId);
    }
    setSelectedKycs(newSelected);
  };

  const handleBulkApprove = () => {
    if (selectedKycs.size === 0) {
      toast.error("No KYC documents selected");
      return;
    }
    const ids = Array.from(selectedKycs);
    bulkApproveMutation.mutate({ ids });
  };

  const handleBulkReject = () => {
    if (selectedKycs.size === 0) {
      toast.error("No KYC documents selected");
      return;
    }
    if (!rejectionReason.trim()) {
      toast.error(t('kyc.enterReason'));
      return;
    }
    const ids = Array.from(selectedKycs);
    bulkRejectMutation.mutate({ ids, reason: rejectionReason });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('kyc.title')}</h1>
            <p className="text-muted-foreground mt-1">
              Review and verify user identity documents
            </p>
          </div>
          <div className="flex gap-2">
            {selectedKycs.size > 0 && (
              <>
                <Button
                  variant="default"
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve {selectedKycs.size}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setRejectingKycId(-1)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject {selectedKycs.size}
                </Button>
              </>
            )}
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {kycList?.length || 0} Pending
            </Badge>
          </div>
        </div>

        {/* KYC List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('kyc.title')}
            </CardTitle>
            <CardDescription>
              Click "View Documents" to review and approve or reject KYC submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : kycList && kycList.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-muted-foreground mt-2">No pending KYC verifications</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedKycs.size === (kycList?.length || 0) && (kycList?.length || 0) > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>{t('users.id')}</TableHead>
                      <TableHead>{t('users.photo')}</TableHead>
                      <TableHead>{t('users.nameKhmer')}</TableHead>
                      <TableHead>{t('users.nameEnglish')}</TableHead>
                      <TableHead>{t('users.nationalId')}</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>{t('users.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycList?.map((item) => (
                      <TableRow 
                        key={item.kycDoc.id} 
                        className={selectedKycs.has(item.kycDoc.id) ? "bg-muted/50" : "hover:bg-muted/50"}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedKycs.has(item.kycDoc.id)}
                            onCheckedChange={() => toggleSelect(item.kycDoc.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.user?.id}</TableCell>
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={item.user?.photoUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {item.user?.nameEnglish?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>{item.user?.nameKhmer || '-'}</TableCell>
                        <TableCell className="font-medium">{item.user?.nameEnglish || '-'}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {item.user?.nationalId || '-'}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(item.kycDoc.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingKyc(item)}
                            >
                              <FileCheck className="h-4 w-4 mr-2" />
                              {t('kyc.viewDocuments')}
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

        {/* View Documents Dialog */}
        <Dialog open={!!viewingKyc && !rejectingKycId} onOpenChange={() => setViewingKyc(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">KYC Document Review</DialogTitle>
              <DialogDescription className="flex items-center gap-4 mt-2">
                <span className="font-medium">
                  {viewingKyc?.user?.nameEnglish} ({viewingKyc?.user?.nameKhmer})
                </span>
                <span className="text-muted-foreground">•</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {viewingKyc?.user?.nationalId}
                </code>
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="front" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="front">NID Front</TabsTrigger>
                <TabsTrigger value="back">NID Back</TabsTrigger>
                <TabsTrigger value="selfie">Selfie with ID</TabsTrigger>
              </TabsList>
              
              <TabsContent value="front" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{t('kyc.nidFront')}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(viewingKyc?.kycDoc.nidFrontUrl, 'nid-front.jpg')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="border rounded-lg overflow-hidden cursor-zoom-in hover:shadow-lg transition-shadow"
                      onClick={() => handleZoomImage(viewingKyc?.kycDoc.nidFrontUrl)}
                    >
                      <img
                        src={viewingKyc?.kycDoc.nidFrontUrl}
                        alt="NID Front"
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <ZoomIn className="h-4 w-4" />
                      Click image to zoom
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="back" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{t('kyc.nidBack')}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(viewingKyc?.kycDoc.nidBackUrl, 'nid-back.jpg')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="border rounded-lg overflow-hidden cursor-zoom-in hover:shadow-lg transition-shadow"
                      onClick={() => handleZoomImage(viewingKyc?.kycDoc.nidBackUrl)}
                    >
                      <img
                        src={viewingKyc?.kycDoc.nidBackUrl}
                        alt="NID Back"
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <ZoomIn className="h-4 w-4" />
                      Click image to zoom
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="selfie" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{t('kyc.selfie')}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(viewingKyc?.kycDoc.selfieUrl, 'selfie.jpg')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="border rounded-lg overflow-hidden cursor-zoom-in hover:shadow-lg transition-shadow"
                      onClick={() => handleZoomImage(viewingKyc?.kycDoc.selfieUrl)}
                    >
                      <img
                        src={viewingKyc?.kycDoc.selfieUrl}
                        alt="Selfie"
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <ZoomIn className="h-4 w-4" />
                      Click image to zoom
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">Verification Checklist</p>
                <ul className="text-sm text-amber-800 mt-2 space-y-1">
                  <li>• ID document is clear and legible</li>
                  <li>• All information is visible and unobstructed</li>
                  <li>• Selfie matches the ID photo</li>
                  <li>• Document has not expired</li>
                  <li>• No signs of tampering or editing</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setViewingKyc(null)}>
                {t('common.close')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectingKycId(viewingKyc?.kycDoc.id)}
              >
                <X className="h-4 w-4 mr-2" />
                {t('kyc.rejectKyc')}
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (viewingKyc) {
                    handleApprove(viewingKyc.kycDoc.id);
                  }
                }}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                {t('kyc.approveKyc')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Zoom Dialog */}
        <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
          <DialogContent className="max-w-7xl max-h-[95vh]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Document Viewer</DialogTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImageRotation((imageRotation + 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="overflow-auto max-h-[75vh] flex items-center justify-center bg-muted/30 rounded-lg p-4">
              <img
                src={zoomedImage || ''}
                alt="Zoomed document"
                style={{
                  transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                  transition: 'transform 0.2s',
                }}
                className="max-w-full h-auto"
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={!!rejectingKycId} onOpenChange={() => {
          setRejectingKycId(null);
          setRejectionReason('');
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {rejectingKycId === -1 ? `Reject ${selectedKycs.size} KYC Documents` : t('kyc.rejectKyc')}
              </DialogTitle>
              <DialogDescription>
                {rejectingKycId === -1 
                  ? 'This will reject all selected KYC documents with the same reason'
                  : t('kyc.rejectionReason')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  {REJECTION_TEMPLATES.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectionReason(template)}
                      className="justify-start text-left h-auto py-2"
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder={t('kyc.enterReason')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingKycId(null);
                  setRejectionReason('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={rejectingKycId === -1 ? handleBulkReject : handleReject}
                disabled={(rejectingKycId === -1 ? bulkRejectMutation.isPending : rejectMutation.isPending) || !rejectionReason.trim()}
              >
                {t('common.reject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Old Reject Dialog - Hidden */}
        <Dialog open={false} onOpenChange={() => {
          setRejectingKycId(null);
          setRejectionReason('');
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('kyc.rejectKyc')}</DialogTitle>
              <DialogDescription>{t('kyc.rejectionReason')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  {REJECTION_TEMPLATES.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectionReason(template)}
                      className="justify-start text-left h-auto py-2"
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder={t('kyc.enterReason')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingKycId(null);
                  setRejectionReason('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
              >
                {t('common.reject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
