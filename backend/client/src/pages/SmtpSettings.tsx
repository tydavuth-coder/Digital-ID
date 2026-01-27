import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Save, RotateCcw, Mail, Send, CheckCircle, XCircle, Loader2, Eye, EyeOff, ArrowLeft, Server, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function SmtpSettings() {
  const { t } = useLanguage();
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState('');
  
  const [formData, setFormData] = useState({
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUsername: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: 'Digital ID System',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        smtpEnabled: settings.smtpEnabled || false,
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || 587,
        smtpSecure: settings.smtpSecure || false,
        smtpUsername: settings.smtpUsername || '',
        smtpPassword: settings.smtpPassword || '',
        smtpFromEmail: settings.smtpFromEmail || '',
        smtpFromName: settings.smtpFromName || 'Digital ID System',
      });
    }
  }, [settings]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success('SMTP settings saved successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const testConnectionMutation = trpc.settings.testSmtpConnection.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setConnectionStatus('success');
        toast.success('SMTP connection successful!');
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Connection failed');
        toast.error(`Connection failed: ${result.error}`);
      }
    },
    onError: (error) => {
      setConnectionStatus('error');
      setConnectionError(error.message);
      toast.error(`Connection failed: ${error.message}`);
    },
  });

  const sendTestEmailMutation = trpc.settings.sendTestEmail.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Test email sent to ${testEmail}`);
      } else {
        toast.error(`Failed to send test email: ${result.error}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to send test email: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleTestConnection = () => {
    if (!formData.smtpHost || !formData.smtpUsername || !formData.smtpPassword) {
      toast.error('Please fill in all required SMTP fields');
      return;
    }
    
    setConnectionStatus('testing');
    setConnectionError('');
    
    testConnectionMutation.mutate({
      host: formData.smtpHost,
      port: formData.smtpPort,
      secure: formData.smtpSecure,
      username: formData.smtpUsername,
      password: formData.smtpPassword,
    });
  };

  const handleSendTestEmail = () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }
    
    if (!formData.smtpEnabled) {
      toast.error('Please enable SMTP and save settings first');
      return;
    }
    
    sendTestEmailMutation.mutate({ email: testEmail });
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        smtpEnabled: settings.smtpEnabled || false,
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || 587,
        smtpSecure: settings.smtpSecure || false,
        smtpUsername: settings.smtpUsername || '',
        smtpPassword: settings.smtpPassword || '',
        smtpFromEmail: settings.smtpFromEmail || '',
        smtpFromName: settings.smtpFromName || 'Digital ID System',
      });
      setConnectionStatus('idle');
      setConnectionError('');
    }
  };

  const commonSmtpPresets = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false },
    { name: 'Outlook/Office 365', host: 'smtp.office365.com', port: 587, secure: false },
    { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587, secure: false },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false },
    { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, secure: false },
    { name: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, secure: false },
  ];

  const applyPreset = (preset: typeof commonSmtpPresets[0]) => {
    setFormData({
      ...formData,
      smtpHost: preset.host,
      smtpPort: preset.port,
      smtpSecure: preset.secure,
    });
    toast.info(`Applied ${preset.name} preset. Please enter your credentials.`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SMTP Email Settings</h1>
            <p className="text-muted-foreground">Configure email server for automated notifications</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enable/Disable SMTP */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Email Service Status</CardTitle>
              </div>
              <CardDescription>Enable or disable automated email notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smtpEnabled">Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, the system will send automated emails for KYC status updates, welcome messages, and alerts
                  </p>
                </div>
                <Switch
                  id="smtpEnabled"
                  checked={formData.smtpEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, smtpEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Presets</CardTitle>
              <CardDescription>Select a common email provider to auto-fill server settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonSmtpPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SMTP Server Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                <CardTitle>SMTP Server Configuration</CardTitle>
              </div>
              <CardDescription>Configure your email server connection details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host *</Label>
                      <Input
                        id="smtpHost"
                        value={formData.smtpHost}
                        onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port *</Label>
                      <Select
                        value={formData.smtpPort.toString()}
                        onValueChange={(value) => {
                          const port = parseInt(value);
                          setFormData({ 
                            ...formData, 
                            smtpPort: port,
                            smtpSecure: port === 465
                          });
                        }}
                      >
                        <SelectTrigger id="smtpPort">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 (SMTP)</SelectItem>
                          <SelectItem value="465">465 (SSL/TLS)</SelectItem>
                          <SelectItem value="587">587 (STARTTLS - Recommended)</SelectItem>
                          <SelectItem value="2525">2525 (Alternative)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable for port 465, disable for STARTTLS (port 587)
                      </p>
                    </div>
                    <Switch
                      id="smtpSecure"
                      checked={formData.smtpSecure}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, smtpSecure: checked })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <CardTitle>Authentication</CardTitle>
              </div>
              <CardDescription>SMTP server login credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">Username / Email *</Label>
                  <Input
                    id="smtpUsername"
                    value={formData.smtpUsername}
                    onChange={(e) => setFormData({ ...formData, smtpUsername: e.target.value })}
                    placeholder="your-email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Password / App Password *</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.smtpPassword}
                      onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                      placeholder="••••••••••••"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For Gmail, use an App Password instead of your regular password
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sender Information */}
          <Card>
            <CardHeader>
              <CardTitle>Sender Information</CardTitle>
              <CardDescription>Configure how emails appear to recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpFromEmail">From Email Address *</Label>
                  <Input
                    id="smtpFromEmail"
                    type="email"
                    value={formData.smtpFromEmail}
                    onChange={(e) => setFormData({ ...formData, smtpFromEmail: e.target.value })}
                    placeholder="noreply@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpFromName">From Name</Label>
                  <Input
                    id="smtpFromName"
                    value={formData.smtpFromName}
                    onChange={(e) => setFormData({ ...formData, smtpFromName: e.target.value })}
                    placeholder="Digital ID System"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Connection */}
          <Card>
            <CardHeader>
              <CardTitle>Test Connection</CardTitle>
              <CardDescription>Verify your SMTP configuration is working correctly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending || !formData.smtpHost}
                >
                  {testConnectionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                
                {connectionStatus === 'success' && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Connection successful
                  </div>
                )}
                
                {connectionStatus === 'error' && (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-2" />
                    {connectionError}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Send Test Email</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Save settings and enable SMTP first, then send a test email to verify delivery
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="max-w-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendTestEmail}
                    disabled={sendTestEmailMutation.isPending || !formData.smtpEnabled}
                  >
                    {sendTestEmailMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Test
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Information */}
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertTitle>Gmail Users</AlertTitle>
            <AlertDescription>
              If using Gmail, you need to create an App Password:
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Go to your Google Account settings</li>
                <li>Navigate to Security → 2-Step Verification</li>
                <li>Scroll down and click on "App passwords"</li>
                <li>Generate a new app password for "Mail"</li>
                <li>Use this 16-character password in the Password field above</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
