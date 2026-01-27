import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Save, RotateCcw, Globe, Languages, Mail } from "lucide-react";
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

export default function SystemSettings() {
  const { t, language, setLanguage } = useLanguage();
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  
  const [formData, setFormData] = useState({
    maintenanceMode: false,
    allowKycUserCreation: true,
    telegramBotToken: '',
    telegramBotId: '',
    smsProvider: '',
    smsApiKey: '',
    smsApiSecret: '',
    smsSenderId: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        maintenanceMode: settings.maintenanceMode,
        allowKycUserCreation: settings.allowKycUserCreation,
        telegramBotToken: settings.telegramBotToken || '',
        telegramBotId: settings.telegramBotId || '',
        smsProvider: settings.smsProvider || '',
        smsApiKey: settings.smsApiKey || '',
        smsApiSecret: settings.smsApiSecret || '',
        smsSenderId: settings.smsSenderId || '',
      });
    }
  }, [settings]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        maintenanceMode: settings.maintenanceMode,
        allowKycUserCreation: settings.allowKycUserCreation,
        telegramBotToken: settings.telegramBotToken || '',
        telegramBotId: settings.telegramBotId || '',
        smsProvider: settings.smsProvider || '',
        smsApiKey: settings.smsApiKey || '',
        smsApiSecret: settings.smsApiSecret || '',
        smsSenderId: settings.smsSenderId || '',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Navigate to other settings pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/settings/smtp">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  SMTP Email Configuration
                </Button>
              </Link>
              <Link href="/settings/email">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Notification Preferences
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                <CardTitle>{t('mobile.language')}</CardTitle>
              </div>
              <CardDescription>Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t('mobile.language')}</Label>
                <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'km')}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="km">ខ្មែរ (Khmer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* General Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <CardTitle>{t('settings.general')}</CardTitle>
              </div>
              <CardDescription>Configure general system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenanceMode">{t('settings.maintenanceMode')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable maintenance mode to prevent user access
                      </p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={formData.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, maintenanceMode: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowKycCreation">{t('settings.allowKycCreation')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register with KYC verification
                      </p>
                    </div>
                    <Switch
                      id="allowKycCreation"
                      checked={formData.allowKycUserCreation}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, allowKycUserCreation: checked })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Telegram OTP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.telegram')}</CardTitle>
              <CardDescription>Configure Telegram bot for OTP verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="telegramBotToken">{t('settings.telegramToken')}</Label>
                    <Input
                      id="telegramBotToken"
                      type="password"
                      value={formData.telegramBotToken}
                      onChange={(e) =>
                        setFormData({ ...formData, telegramBotToken: e.target.value })
                      }
                      placeholder="Enter Telegram bot token"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegramBotId">{t('settings.telegramBotId')}</Label>
                    <Input
                      id="telegramBotId"
                      value={formData.telegramBotId}
                      onChange={(e) =>
                        setFormData({ ...formData, telegramBotId: e.target.value })
                      }
                      placeholder="Enter Telegram bot ID"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* SMS OTP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.sms')}</CardTitle>
              <CardDescription>Configure SMS provider for OTP verification</CardDescription>
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
                  <div className="space-y-2">
                    <Label htmlFor="smsProvider">{t('settings.smsProvider')}</Label>
                    <Input
                      id="smsProvider"
                      value={formData.smsProvider}
                      onChange={(e) =>
                        setFormData({ ...formData, smsProvider: e.target.value })
                      }
                      placeholder="e.g., Twilio, AWS SNS"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smsApiKey">{t('settings.smsApiKey')}</Label>
                    <Input
                      id="smsApiKey"
                      type="password"
                      value={formData.smsApiKey}
                      onChange={(e) =>
                        setFormData({ ...formData, smsApiKey: e.target.value })
                      }
                      placeholder="Enter SMS API key"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smsApiSecret">{t('settings.smsApiSecret')}</Label>
                    <Input
                      id="smsApiSecret"
                      type="password"
                      value={formData.smsApiSecret}
                      onChange={(e) =>
                        setFormData({ ...formData, smsApiSecret: e.target.value })
                      }
                      placeholder="Enter SMS API secret"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smsSenderId">{t('settings.smsSenderId')}</Label>
                    <Input
                      id="smsSenderId"
                      value={formData.smsSenderId}
                      onChange={(e) =>
                        setFormData({ ...formData, smsSenderId: e.target.value })
                      }
                      placeholder="Enter SMS sender ID"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('settings.resetDefault')}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {t('settings.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
