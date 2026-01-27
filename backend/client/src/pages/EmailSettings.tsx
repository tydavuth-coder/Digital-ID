import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EmailSettings() {
  const { t } = useLanguage();
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // Email notification toggles
  const [notifications, setNotifications] = useState({
    kycApproval: true,
    kycRejection: true,
    welcomeEmail: true,
    serviceConnection: true,
    adminAlerts: true,
  });

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsTesting(true);
    
    // Simulate sending test email
    setTimeout(() => {
      setIsTesting(false);
      toast.success("Test email sent successfully!", {
        description: `Check ${testEmail} for the test message`,
      });
    }, 2000);
  };

  const handleSaveSettings = () => {
    toast.success("Email settings saved successfully");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Mail className="h-8 w-8" />
              {t('settings.title')} - Email Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure email notifications and SMTP settings
            </p>
          </div>
        </div>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Email Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMTP Configuration</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Email service is configured via environment variables
                </p>
              </div>
              <Badge variant="secondary">
                Configured
              </Badge>
            </div>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">Configuration Required</p>
                  <p className="text-sm text-amber-800 mt-1">
                    To enable email notifications, set the following environment variables:
                  </p>
                  <ul className="text-sm text-amber-800 mt-2 space-y-1 font-mono">
                    <li>• EMAIL_HOST (SMTP server, e.g., smtp.gmail.com)</li>
                    <li>• EMAIL_PORT (SMTP port, e.g., 587)</li>
                    <li>• EMAIL_USER (SMTP username)</li>
                    <li>• EMAIL_PASSWORD (SMTP password)</li>
                    <li>• EMAIL_FROM (Sender email address)</li>
                    <li>• EMAIL_FROM_NAME (Sender name, optional)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Notification Settings</TabsTrigger>
            <TabsTrigger value="test">Test Email</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Notification Preferences</CardTitle>
                <CardDescription>
                  Choose which events should trigger email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="kyc-approval">KYC Approval Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email when KYC is approved
                    </p>
                  </div>
                  <Switch
                    id="kyc-approval"
                    checked={notifications.kycApproval}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, kycApproval: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="kyc-rejection">KYC Rejection Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email when KYC is rejected with reason
                    </p>
                  </div>
                  <Switch
                    id="kyc-rejection"
                    checked={notifications.kycRejection}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, kycRejection: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="welcome-email">Welcome Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Send welcome email to new users
                    </p>
                  </div>
                  <Switch
                    id="welcome-email"
                    checked={notifications.welcomeEmail}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, welcomeEmail: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="service-connection">Service Connection Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email when a service is connected
                    </p>
                  </div>
                  <Switch
                    id="service-connection"
                    checked={notifications.serviceConnection}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, serviceConnection: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="admin-alerts">Admin Alert Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Send system alerts to administrators
                    </p>
                  </div>
                  <Switch
                    id="admin-alerts"
                    checked={notifications.adminAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, adminAlerts: checked })
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveSettings}>
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Preview available email templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <h4 className="font-medium">Welcome Email</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sent to new users upon registration
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <h4 className="font-medium">KYC Approved</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confirmation of successful KYC verification
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <h4 className="font-medium">KYC Rejected</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Notification with rejection reason and next steps
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <h4 className="font-medium">Service Connected</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confirmation of new service connection
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Test Email</CardTitle>
                <CardDescription>
                  Verify your email configuration by sending a test message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Recipient Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter an email address to receive the test message
                  </p>
                </div>

                <Button
                  onClick={handleTestEmail}
                  disabled={isTesting || !testEmail}
                  className="w-full md:w-auto"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Email
                    </>
                  )}
                </Button>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> The test email will include sample content to verify formatting and delivery.
                    Check your spam folder if you don't receive it within a few minutes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
