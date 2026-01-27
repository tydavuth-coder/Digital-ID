import nodemailer from 'nodemailer';
import { getDb } from './db';
import { systemSettings } from '../drizzle/schema';

/**
 * Email service for sending notifications
 * 
 * Configuration can be set via:
 * 1. Database settings (preferred) - Configure in Admin Settings > Email
 * 2. Environment variables (fallback):
 *    - EMAIL_HOST: SMTP server host
 *    - EMAIL_PORT: SMTP port
 *    - EMAIL_USER: SMTP username
 *    - EMAIL_PASSWORD: SMTP password
 *    - EMAIL_FROM: Sender email address
 *    - EMAIL_FROM_NAME: Sender name
 */

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Cache for SMTP configuration
let cachedConfig: SmtpConfig | null = null;
let configLastFetched = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute cache

// Get SMTP configuration from database or environment
async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const now = Date.now();
  
  // Return cached config if still valid
  if (cachedConfig && (now - configLastFetched) < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }
  
  try {
    const db = await getDb();
    if (db) {
      const settings = await db.select().from(systemSettings).limit(1);
      if (settings.length > 0 && settings[0].smtpHost && settings[0].smtpEnabled) {
        cachedConfig = {
          host: settings[0].smtpHost,
          port: settings[0].smtpPort || 587,
          secure: settings[0].smtpSecure || false,
          username: settings[0].smtpUsername || '',
          password: settings[0].smtpPassword || '',
          fromEmail: settings[0].smtpFromEmail || '',
          fromName: settings[0].smtpFromName || 'Digital ID System',
          enabled: settings[0].smtpEnabled || false,
        };
        configLastFetched = now;
        return cachedConfig;
      }
    }
  } catch (error) {
    console.warn('[Email] Failed to fetch SMTP config from database:', error);
  }
  
  // Fallback to environment variables
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    cachedConfig = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      username: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      fromEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      fromName: process.env.EMAIL_FROM_NAME || 'Digital ID System',
      enabled: true,
    };
    configLastFetched = now;
    return cachedConfig;
  }
  
  return null;
}

// Clear config cache (call after updating settings)
export function clearSmtpConfigCache() {
  cachedConfig = null;
  configLastFetched = 0;
}

// Create transporter with current config
async function createTransporter(): Promise<nodemailer.Transporter | null> {
  const config = await getSmtpConfig();
  
  if (!config || !config.enabled) {
    console.warn('[Email] Email service not configured or disabled');
    return null;
  }
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
}

// Test SMTP connection
export async function testSmtpConnection(config: Partial<SmtpConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      secure: config.secure || false,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });
    
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Connection failed' };
  }
}

// Send test email
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getSmtpConfig();
    if (!config) {
      return { success: false, error: 'SMTP not configured' };
    }
    
    const transporter = await createTransporter();
    if (!transporter) {
      return { success: false, error: 'Failed to create transporter' };
    }
    
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject: 'Digital ID - Test Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-box { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Test Email</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2 style="color: #059669; margin: 0;">✓ Email Configuration Working!</h2>
                <p style="margin: 10px 0 0 0;">Your SMTP settings are correctly configured.</p>
              </div>
              <p style="margin-top: 20px;">This is a test email from the Digital ID System to verify your email configuration.</p>
              <p><strong>Configuration Details:</strong></p>
              <ul>
                <li>SMTP Host: ${config.host}</li>
                <li>SMTP Port: ${config.port}</li>
                <li>Secure: ${config.secure ? 'Yes (SSL/TLS)' : 'No'}</li>
                <li>From: ${config.fromName} &lt;${config.fromEmail}&gt;</li>
              </ul>
              <p>Sent at: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send test email' };
  }
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  const config = await getSmtpConfig();
  if (!config) {
    console.warn('[Email] Cannot send email: SMTP not configured');
    return false;
  }
  
  const transporter = await createTransporter();
  if (!transporter) {
    console.warn('[Email] Cannot send email: transporter not available');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

// Email Templates

export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<boolean> {
  const subject = 'Welcome to Digital ID System';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Welcome to Digital ID</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Welcome to the Digital ID System! Your account has been successfully created.</p>
          <p>With Digital ID, you can:</p>
          <ul>
            <li>Complete KYC verification for secure identity authentication</li>
            <li>Connect to multiple services with a single digital identity</li>
            <li>Use QR code authentication for quick and secure access</li>
            <li>Manage your profile and connected services</li>
          </ul>
          <p>To get started, please complete your KYC verification by submitting your identity documents.</p>
          <div style="text-align: center;">
            <a href="${process.env.VITE_OAUTH_PORTAL_URL || '#'}" class="button">Get Started</a>
          </div>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Digital ID Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendKycApprovedEmail(
  to: string,
  userName: string
): Promise<boolean> {
  const subject = 'KYC Verification Approved ✓';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-icon { font-size: 48px; margin: 20px 0; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✓</div>
          <h1 style="margin: 0;">KYC Verification Approved</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Great news! Your KYC verification has been <strong>approved</strong>.</p>
          <p>Your identity has been successfully verified, and you now have full access to all Digital ID features:</p>
          <ul>
            <li>Connect to third-party services</li>
            <li>Use QR code authentication</li>
            <li>Access premium features</li>
            <li>Enhanced security and trust</li>
          </ul>
          <div style="text-align: center;">
            <a href="${process.env.VITE_OAUTH_PORTAL_URL || '#'}" class="button">Access Your Account</a>
          </div>
          <p>Thank you for completing the verification process!</p>
          <p>Best regards,<br>The Digital ID Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendKycRejectedEmail(
  to: string,
  userName: string,
  reason: string
): Promise<boolean> {
  const subject = 'KYC Verification Requires Attention';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .reason-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">KYC Verification Update</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Thank you for submitting your KYC verification documents. Unfortunately, we were unable to approve your verification at this time.</p>
          <div class="reason-box">
            <strong>Reason:</strong><br>
            ${reason}
          </div>
          <p><strong>What to do next:</strong></p>
          <ul>
            <li>Review the reason above carefully</li>
            <li>Prepare new documents that address the issue</li>
            <li>Resubmit your KYC verification</li>
          </ul>
          <div style="text-align: center;">
            <a href="${process.env.VITE_OAUTH_PORTAL_URL || '#'}" class="button">Resubmit KYC</a>
          </div>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The Digital ID Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendServiceConnectedEmail(
  to: string,
  userName: string,
  serviceName: string
): Promise<boolean> {
  const subject = `Service Connected: ${serviceName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .service-box { background: white; border: 2px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Service Connected</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>
          <p>A new service has been successfully connected to your Digital ID account.</p>
          <div class="service-box">
            <h2 style="margin: 0; color: #1e40af;">${serviceName}</h2>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Connected successfully</p>
          </div>
          <p>You can now use your Digital ID to authenticate with this service.</p>
          <p>Best regards,<br>The Digital ID Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendAdminAlertEmail(
  to: string,
  alertType: string,
  message: string,
  details?: Record<string, string>
): Promise<boolean> {
  const subject = `[Admin Alert] ${alertType}`;
  const detailsHtml = details 
    ? Object.entries(details).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')
    : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⚠️ Admin Alert</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <strong>${alertType}</strong><br>
            ${message}
          </div>
          ${detailsHtml ? `<p><strong>Details:</strong></p><ul>${detailsHtml}</ul>` : ''}
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Best regards,<br>Digital ID System</p>
        </div>
        <div class="footer">
          <p>This is an automated system alert.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

// Send scheduled report email
export async function sendScheduledReportEmail(
  recipients: string[],
  reportName: string,
  reportType: string,
  pdfBuffer: Buffer
): Promise<boolean> {
  const config = await getSmtpConfig();
  if (!config || !config.enabled) {
    console.warn('[Email] SMTP not configured or disabled');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
  const subject = `${reportName} - ${reportType} Report`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${reportType} Report</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="content">
          <h2>${reportName}</h2>
          <p>Please find attached the ${reportType.toLowerCase()} report for the Digital ID System.</p>
          <p>This report includes:</p>
          <ul>
            <li>User statistics and growth trends</li>
            <li>KYC verification metrics</li>
            <li>Service usage analytics</li>
            <li>System activity summary</li>
          </ul>
          <p>Generated at: ${new Date().toISOString()}</p>
        </div>
        <div class="footer">
          <p>This is an automated report. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    for (const recipient of recipients) {
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: recipient,
        subject,
        html,
        attachments: [
          {
            filename: `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    }
    console.log(`[Email] Scheduled report sent to ${recipients.length} recipient(s)`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send scheduled report:', error);
    return false;
  }
}
