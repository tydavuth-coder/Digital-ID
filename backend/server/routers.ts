import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { nanoid } from "nanoid";
import { 
  sendKycApprovedEmail, 
  sendKycRejectedEmail, 
  sendServiceConnectedEmail, 
  testSmtpConnection, 
  sendTestEmail, 
  clearSmtpConfigCache, 
  sendScheduledReportEmail 
} from "./email";
import { generatePDFReport, type ReportData } from "./reports";
// ✅ IMPORT WEBSOCKET FUNCTIONS
import { emitDashboardLoginSuccess, getIO } from "./websocket";

// ✅ IMPORT OCR FUNCTION (ប្រាកដថាអ្នកមាន file _core/ocr.ts ត្រឹមត្រូវ)
import { extractDataFromID } from "./_core/ocr";

// Helper function to calculate next run time for scheduled reports
function calculateNextRunTime(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  timeOfDay: string = "09:00"
): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  
  switch (frequency) {
    case 'daily':
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;
    case 'weekly':
      const targetDay = dayOfWeek ?? 1; // Default to Monday
      const currentDay = next.getDay();
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && next <= now)) {
        daysUntilTarget += 7;
      }
      next.setDate(next.getDate() + daysUntilTarget);
      break;
    case 'monthly':
      const targetDate = dayOfMonth ?? 1; // Default to 1st
      next.setDate(targetDate);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
    case 'quarterly':
      const currentMonth = next.getMonth();
      const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3;
      next.setMonth(nextQuarterMonth);
      next.setDate(dayOfMonth ?? 1);
      if (next <= now) {
        next.setMonth(next.getMonth() + 3);
      }
      break;
  }
  
  return next;
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin' && ctx.user.role !== 'system_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // ✅ PUBLIC KYC SUBMISSION WITH OCR INTEGRATION & DOB FIX
    submitKYC: publicProcedure.input(z.object({
      nameKh: z.string().optional(),
      nameEn: z.string().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      idNumber: z.string().optional(),
      dob: z.string().optional(),
      pob: z.string().optional(),
      address: z.string().optional(),
      expiryDate: z.string().optional(),
      frontImage: z.string().optional(),
      backImage: z.string().optional(),
      selfieImage: z.string().optional(),
    })).mutation(async ({ input }) => {
      try {
        const openId = `user_${nanoid(10)}`;
        
        // --- STEP 1: OCR PROCESSING ---
        let ocrData: any = {};
        if (input.frontImage) {
            console.log("Processing OCR for National ID...");
            // ហៅទៅ Google Cloud Vision ដើម្បីអានទិន្នន័យ
            ocrData = await extractDataFromID(input.frontImage);
            console.log("OCR Result:", ocrData);
        }

        // --- STEP 2: MERGE DATA (Input vs OCR) ---
        // ប្រើទិន្នន័យពី User បើមាន, បើគ្មានប្រើពី OCR, បើគ្មានទៀតដាក់ Unknown
        const finalNameEn = input.nameEn || ocrData.nameEn || "Unknown";
        const finalNameKh = input.nameKh || ocrData.nameKh;
        const finalNationalId = input.idNumber || ocrData.nationalId;
        const finalDob = input.dob || ocrData.dob; // ✅ យកថ្ងៃកំណើតពី OCR
        const finalExpiry = input.expiryDate || ocrData.expiryDate; // ✅ យកថ្ងៃអស់សុពលភាព
        // ------------------------------

        // 3. Create User (Pending State)
        await db.upsertUser({
            openId: openId,
            name: finalNameEn,
            email: `temp_${nanoid(5)}@digitalid.local` 
        });

        const createdUser = await db.getUserByOpenId(openId);
        if (!createdUser) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }
        
        // 4. Update Details (Save everything to DB)
        await db.updateUser(createdUser.id, {
            nameKhmer: finalNameKh,
            nameEnglish: finalNameEn,
            nationalId: finalNationalId,
            dob: finalDob,             // ✅ Save ថ្ងៃកំណើត (សំខាន់កុំឱ្យគាំង)
            idExpiryDate: finalExpiry, // ✅ Save ថ្ងៃអស់សុពលភាព
            gender: input.gender as any,
            address: input.address,
            status: "pending",
            kycStatus: "pending",
            role: "user"
        });

        const newUserId = createdUser.id;

        // 5. Insert Documents Images
        await db.createKycDocument({
            userId: newUserId,
            nidFrontUrl: input.frontImage || "",
            nidBackUrl: input.backImage || "",
            selfieUrl: input.selfieImage || "",
        });
        
        // 6. Log Activity
        await db.createActivityLog({
            userId: newUserId, 
            username: finalNameEn,
            action: "Submitted KYC Registration",
            actionType: "kyc_submit",
            // Log នេះនឹងបង្ហាញក្នុង Dashboard ថា OCR ដំណើរការឬអត់
            description: `New user application via Mobile App. OCR detected ID: ${finalNationalId || "N/A"}`,
        });

        // 7. Notify Admins (WebSocket)
        try {
            const io = getIO();
            io.to("admins").emit("kyc-submission", {
                userId: newUserId,
                userName: finalNameEn,
                timestamp: new Date()
            });
        } catch (e) {
            console.log("WebSocket notification warning:", e);
        }
        
        return { 
          success: true, 
          userId: newUserId,
          extractedData: ocrData // ត្រឡប់ទិន្នន័យទៅ Frontend វិញ
        };

      } catch (error) {
        console.error("KYC Submit Error:", error);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to submit KYC application'
        });
      }
    }),
  }),

  // ============= MOBILE APP SYNC (SCAN QR LOGIN) =============
  mobile: router({
    authorizeDashboard: protectedProcedure
      .input(z.object({
        socketId: z.string(), // The QR Code content
        deviceInfo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // 1. Generate session token
          const webSessionToken = nanoid(64);
          
          // 2. Save session
          await db.createActiveSession({
             userId: ctx.user.id,
             sessionToken: webSessionToken,
             deviceInfo: "Web Dashboard (Authorized via Mobile)",
             ipAddress: ctx.req.ip,
             expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
          });

          // 3. Send success signal via WebSocket
          emitDashboardLoginSuccess(input.socketId, {
            token: webSessionToken,
            user: {
              id: ctx.user.id,
              name: ctx.user.nameEnglish || ctx.user.name,
              email: ctx.user.email,
              role: ctx.user.role,
              photoUrl: ctx.user.photoUrl
            }
          });

          // 4. Log activity
          await db.createActivityLog({
            userId: ctx.user.id,
            username: ctx.user.name || ctx.user.email || "User",
            action: "QR Login to Dashboard",
            actionType: "qr_scan",
            description: `Authorized web dashboard login via mobile app`,
            ipAddress: ctx.req.ip,
          });

          return { success: true, message: "Dashboard authorized successfully" };
        } catch (error) {
          console.error("[Mobile Sync] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to sync with dashboard",
          });
        }
      }),
  }),

  // ============= DASHBOARD STATISTICS =============
  dashboard: router({
    getStats: adminProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),

  // ============= USER MANAGEMENT =============
  users: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    getById: adminProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return await db.getUserById(input.id);
    }),
    
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        nameKhmer: z.string().optional(),
        nameEnglish: z.string().optional(),
        nationalId: z.string().optional(),
        username: z.string().optional(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        address: z.string().optional(),
        status: z.enum(["active", "pending", "blocked"]).optional(),
        photoUrl: z.string().optional(),
        role: z.enum(["user", "admin", "kyc_reviewer", "system_admin", "super_admin"]).optional(),
        dob: z.string().optional(), // ✅ Allow updating DOB
        idExpiryDate: z.string().optional(), // ✅ Allow updating Expiry
      }),
    })).mutation(async ({ input, ctx }) => {
      const updated = await db.updateUser(input.id, input.data);
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Updated user ${input.id}`,
        actionType: "admin_action",
        description: `Admin updated user information`,
      });
      
      return updated;
    }),
    
    delete: adminProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const success = await db.deleteUser(input.id);
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Deleted user ${input.id}`,
        actionType: "admin_action",
        description: `Admin deleted user`,
      });
      
      return { success };
    }),
    
    bulkImport: adminProcedure.input(z.object({
      users: z.array(z.object({
        nameKhmer: z.string().optional(),
        nameEnglish: z.string(),
        nationalId: z.string().optional(),
        username: z.string().optional(),
        email: z.string().email(),
        phoneNumber: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        address: z.string().optional(),
        status: z.enum(["active", "pending", "blocked"]).optional(),
      })),
    })).mutation(async ({ input, ctx }) => {
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];
      
      for (const userData of input.users) {
        try {
          const tempOpenId = `imported_${nanoid(16)}`;
          await db.upsertUser({
            openId: tempOpenId,
            name: userData.nameEnglish,
            email: userData.email,
          });
          
          const user = await db.getUserByOpenId(tempOpenId);
          if (user) {
            await db.updateUser(user.id, {
              nameKhmer: userData.nameKhmer,
              nameEnglish: userData.nameEnglish,
              nationalId: userData.nationalId,
              username: userData.username,
              phoneNumber: userData.phoneNumber,
              gender: userData.gender,
              address: userData.address,
              status: userData.status || "pending",
            });
          }
          successCount++;
        } catch (error) {
          failedCount++;
          errors.push(`Failed to import ${userData.email}: ${error}`);
        }
      }
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Bulk imported ${successCount} users`,
        actionType: "admin_action",
        description: `Admin bulk imported users (${successCount} succeeded, ${failedCount} failed)`,
      });
      
      return { success: successCount, failed: failedCount, errors };
    }),
  }),

  // ============= KYC VERIFICATION (ADMIN) =============
  kyc: router({
    getPending: adminProcedure.query(async () => {
      return await db.getPendingKycDocuments();
    }),
    
    approve: adminProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const success = await db.updateKycStatus(input.id, "approved", ctx.user.id);
      
      try {
        const kycDocs = await db.getPendingKycDocuments();
        const kycDoc = kycDocs.find(doc => doc.kycDoc.id === input.id);
        if (kycDoc?.user?.email && kycDoc?.user?.nameEnglish) {
          await sendKycApprovedEmail(kycDoc.user.email, kycDoc.user.nameEnglish);
        }
      } catch (error) {
        console.error('[KYC] Failed to send approval email:', error);
      }
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Approved KYC document ${input.id}`,
        actionType: "kyc_approve",
        description: `Admin approved KYC verification`,
      });
      
      return { success };
    }),
    
    reject: adminProcedure.input(z.object({
      id: z.number(),
      reason: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const success = await db.updateKycStatus(input.id, "rejected", ctx.user.id, input.reason);
      
      try {
        const kycDocs = await db.getPendingKycDocuments();
        const kycDoc = kycDocs.find(doc => doc.kycDoc.id === input.id);
        if (kycDoc?.user?.email && kycDoc?.user?.nameEnglish) {
          await sendKycRejectedEmail(kycDoc.user.email, kycDoc.user.nameEnglish, input.reason);
        }
      } catch (error) {
        console.error('[KYC] Failed to send rejection email:', error);
      }
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Rejected KYC document ${input.id}`,
        actionType: "kyc_reject",
        description: `Admin rejected KYC verification: ${input.reason}`,
      });
      
      return { success };
    }),
    
    getMyKyc: protectedProcedure.query(async ({ ctx }) => {
      return await db.getKycDocumentByUserId(ctx.user.id);
    }),
    
    bulkApprove: adminProcedure.input(z.object({
      ids: z.array(z.number()),
    })).mutation(async ({ input, ctx }) => {
      let successCount = 0;
      let failedCount = 0;
      
      for (const id of input.ids) {
        try {
          await db.updateKycStatus(id, "approved", ctx.user.id);
          successCount++;
        } catch (error) {
          failedCount++;
        }
      }
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Bulk approved ${successCount} KYC documents`,
        actionType: "kyc_approve",
        description: `Admin bulk approved KYC verifications`,
      });
      
      return { success: successCount, failed: failedCount };
    }),
    
    bulkReject: adminProcedure.input(z.object({
      ids: z.array(z.number()),
      reason: z.string(),
    })).mutation(async ({ input, ctx }) => {
      let successCount = 0;
      let failedCount = 0;
      
      for (const id of input.ids) {
        try {
          await db.updateKycStatus(id, "rejected", ctx.user.id, input.reason);
          successCount++;
        } catch (error) {
          failedCount++;
        }
      }
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Bulk rejected ${successCount} KYC documents`,
        actionType: "kyc_reject",
        description: `Admin bulk rejected KYC verifications`,
      });
      
      return { success: successCount, failed: failedCount };
    }),
  }),

  // ============= SERVICE MANAGEMENT =============
  services: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllServices();
    }),
    
    getActive: publicProcedure.query(async () => {
      return await db.getActiveServices();
    }),
    
    create: adminProcedure.input(z.object({
      name: z.string(),
      nameKhmer: z.string().optional(),
      nameEnglish: z.string().optional(),
      description: z.string().optional(),
      logoUrl: z.string().optional(),
      callbackUrl: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const token = nanoid(32);
      const secret = nanoid(64);
      
      const result = await db.createService({
        ...input,
        token,
        secret,
      });
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Created service: ${input.name}`,
        actionType: "admin_action",
        description: `Admin created new service`,
      });
      
      return result;
    }),
    
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        nameKhmer: z.string().optional(),
        nameEnglish: z.string().optional(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        callbackUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    })).mutation(async ({ input, ctx }) => {
      const updated = await db.updateService(input.id, input.data);
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Updated service ${input.id}`,
        actionType: "admin_action",
        description: `Admin updated service information`,
      });
      
      return updated;
    }),
    
    delete: adminProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const success = await db.deleteService(input.id);
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Deleted service ${input.id}`,
        actionType: "admin_action",
        description: `Admin deleted service`,
      });
      
      return { success };
    }),
    
    regenerateCredentials: adminProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const token = nanoid(32);
      const secret = nanoid(64);
      
      const updated = await db.updateService(input.id, { token, secret });
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Regenerated credentials for service ${input.id}`,
        actionType: "admin_action",
        description: `Admin regenerated service credentials`,
      });
      
      return updated;
    }),
  }),

  // ============= USER SERVICES =============
  userServices: router({
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserServices(ctx.user.id);
    }),
    
    connect: protectedProcedure.input(z.object({
      serviceId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const result = await db.connectUserToService(ctx.user.id, input.serviceId);
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "User",
        action: `Connected to service ${input.serviceId}`,
        actionType: "service_connect",
        description: "User connected to a new service",
      });
      
      return result;
    }),
    
    disconnect: protectedProcedure.input(z.object({
      serviceId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const success = await db.disconnectUserFromService(ctx.user.id, input.serviceId);
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "User",
        action: `Disconnected from service ${input.serviceId}`,
        actionType: "service_disconnect",
        description: "User disconnected from a service",
      });
      
      return { success };
    }),
  }),

  // ============= ACTIVITY LOGS =============
  logs: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllActivityLogs();
    }),
    
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserActivityLogs(ctx.user.id);
    }),
    
    clear: adminProcedure.mutation(async ({ ctx }) => {
      const success = await db.clearActivityLogs();
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: "Cleared all activity logs",
        actionType: "admin_action",
        description: "Admin cleared all system logs",
      });
      
      return { success };
    }),
  }),

  // ============= SYSTEM SETTINGS =============
  settings: router({
    get: adminProcedure.query(async () => {
      return await db.getSystemSettings();
    }),
    
    update: adminProcedure.input(z.object({
      maintenanceMode: z.boolean().optional(),
      allowKycUserCreation: z.boolean().optional(),
      telegramBotToken: z.string().optional(),
      telegramBotId: z.string().optional(),
      smsProvider: z.string().optional(),
      smsApiKey: z.string().optional(),
      smsApiSecret: z.string().optional(),
      smsSenderId: z.string().optional(),
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      smtpSecure: z.boolean().optional(),
      smtpUsername: z.string().optional(),
      smtpPassword: z.string().optional(),
      smtpFromEmail: z.string().email().optional(),
      smtpFromName: z.string().optional(),
      smtpEnabled: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const updated = await db.updateSystemSettings(input, ctx.user.id);
      clearSmtpConfigCache();
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: "Updated system settings",
        actionType: "admin_action",
        description: "Admin updated system configuration",
      });
      
      return updated;
    }),
    
    testSmtpConnection: adminProcedure.input(z.object({
      host: z.string(),
      port: z.number(),
      secure: z.boolean(),
      username: z.string(),
      password: z.string(),
    })).mutation(async ({ input }) => {
      return await testSmtpConnection(input);
    }),
    
    sendTestEmail: adminProcedure.input(z.object({
      email: z.string().email(),
    })).mutation(async ({ input, ctx }) => {
      const result = await sendTestEmail(input.email);
      
      if (result.success) {
        await db.createActivityLog({
          userId: ctx.user.id,
          username: ctx.user.name || ctx.user.email || "Admin",
          action: "Sent test email",
          actionType: "admin_action",
          description: `Test email sent to ${input.email}`,
        });
      }
      
      return result;
    }),
  }),

  // ============= NOTIFICATIONS =============
  notifications: router({
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNotifications(ctx.user.id);
    }),
    
    getAll: adminProcedure.query(async () => {
      return await db.getAllNotifications();
    }),
    
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const notifications = await db.getUserNotifications(ctx.user.id);
      return notifications.filter((n: any) => !n.isRead).length;
    }),
    
    markAsRead: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input }) => {
      const success = await db.markNotificationAsRead(input.id);
      return { success };
    }),
    
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      const success = await db.markAllNotificationsAsRead(ctx.user.id);
      return { success };
    }),
    
    create: adminProcedure.input(z.object({
      userId: z.number(),
      title: z.string(),
      titleKhmer: z.string().optional(),
      titleEnglish: z.string().optional(),
      message: z.string(),
      messageKhmer: z.string().optional(),
      messageEnglish: z.string().optional(),
      type: z.enum(["info", "success", "warning", "error"]).default("info"),
    })).mutation(async ({ input }) => {
      const notification = await db.createNotification(input);
      return notification;
    }),
    
    delete: adminProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input }) => {
      const success = await db.deleteNotification(input.id);
      return { success };
    }),
  }),

  // ============= QR AUTHENTICATION (FOR 3RD PARTY APPS) =============
  qrAuth: router({
    generateToken: protectedProcedure.input(z.object({
      serviceId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 
      
      await db.createQrAuthToken({
        userId: ctx.user.id,
        serviceId: input.serviceId,
        token,
        expiresAt,
      });
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "User",
        action: `Generated QR auth token for service ${input.serviceId}`,
        actionType: "qr_scan",
        description: "User generated QR authentication token",
      });
      
      return { token };
    }),
    
    verifyToken: publicProcedure.input(z.object({
      token: z.string(),
    })).mutation(async ({ input }) => {
      const qrToken = await db.getQrAuthToken(input.token);
      
      if (!qrToken) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid token' });
      }
      
      if (qrToken.isUsed) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token already used' });
      }
      
      if (new Date() > qrToken.expiresAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token expired' });
      }
      
      await db.markQrTokenAsUsed(input.token);
      
      const user = await db.getUserById(qrToken.userId);
      
      return {
        userId: qrToken.userId,
        serviceId: qrToken.serviceId,
        user,
      };
    }),
  }),

  // ============= ANALYTICS REPORTS =============
  reports: router({
    generate: adminProcedure.input(z.object({
      reportType: z.enum(["monthly", "quarterly"]),
      startDate: z.string(),
      endDate: z.string(),
    })).mutation(async ({ input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const allUsers = await db.getAllUsers();
      const allLogs = await db.getAllActivityLogs();

      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => u.status === "active").length;
      const pendingKYC = allUsers.filter(u => u.kycStatus === "pending").length;
      const approvedKYC = allUsers.filter(u => u.kycStatus === "approved").length;
      const rejectedKYC = allUsers.filter(u => u.kycStatus === "rejected").length;
      const activeSessions = allLogs.filter(l => l.actionType === "login").length;

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const userGrowthData = months.map((month, index) => ({
        month,
        count: Math.floor(totalUsers * (0.5 + index * 0.1)),
      }));

      const kycApprovalData = months.map((month, index) => ({
        month,
        approved: Math.floor(approvedKYC / 6),
        rejected: Math.floor(rejectedKYC / 6),
      }));

      const serviceUsageData = [
        { service: "Moodle LMS", connections: Math.floor(totalUsers * 0.6) },
        { service: "Mobile App", connections: Math.floor(totalUsers * 0.8) },
        { service: "Admin Portal", connections: Math.floor(totalUsers * 0.3) },
      ];

      const recentUsers = allUsers.slice(0, 20);

      const reportData: ReportData = {
        totalUsers,
        activeUsers,
        pendingKYC,
        approvedKYC,
        rejectedKYC,
        activeSessions,
        userGrowthData,
        kycApprovalData,
        serviceUsageData,
        recentUsers,
        dateRange: { start: startDate, end: endDate },
        reportType: input.reportType,
      };

      const pdfBuffer = await generatePDFReport(reportData);

      return {
        success: true,
        pdf: pdfBuffer.toString("base64"),
      };
    }),
  }),

  // ============= REPORT SCHEDULES =============
  reportSchedules: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllReportSchedules();
    }),
    
    getById: adminProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return await db.getReportScheduleById(input.id);
    }),
    
    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      reportType: z.enum(["monthly", "quarterly", "weekly", "custom"]),
      frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default("09:00"),
      recipientEmails: z.array(z.string().email()).min(1),
      isEnabled: z.boolean().default(true),
    })).mutation(async ({ input, ctx }) => {
      const nextRunAt = calculateNextRunTime(input.frequency, input.dayOfWeek, input.dayOfMonth, input.timeOfDay);
      
      const schedule = await db.createReportSchedule({
        ...input,
        recipientEmails: JSON.stringify(input.recipientEmails),
        nextRunAt,
        createdBy: ctx.user.id,
      });
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Created report schedule: ${input.name}`,
        actionType: "admin_action",
        description: `Admin created a ${input.frequency} ${input.reportType} report schedule`,
      });
      
      return schedule;
    }),
    
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().min(1).optional(),
        reportType: z.enum(["monthly", "quarterly", "weekly", "custom"]).optional(),
        frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]).optional(),
        dayOfWeek: z.number().min(0).max(6).optional().nullable(),
        dayOfMonth: z.number().min(1).max(31).optional().nullable(),
        timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        recipientEmails: z.array(z.string().email()).optional(),
        isEnabled: z.boolean().optional(),
      }),
    })).mutation(async ({ input, ctx }) => {
      const updateData: any = { ...input.data };
      
      if (input.data.recipientEmails) {
        updateData.recipientEmails = JSON.stringify(input.data.recipientEmails);
      }
      
      if (input.data.frequency || input.data.dayOfWeek !== undefined || input.data.dayOfMonth !== undefined || input.data.timeOfDay) {
        const existingSchedule = await db.getReportScheduleById(input.id);
        if (existingSchedule) {
          updateData.nextRunAt = calculateNextRunTime(
            input.data.frequency || existingSchedule.frequency,
            input.data.dayOfWeek ?? existingSchedule.dayOfWeek ?? undefined,
            input.data.dayOfMonth ?? existingSchedule.dayOfMonth ?? undefined,
            input.data.timeOfDay || existingSchedule.timeOfDay || "09:00"
          );
        }
      }
      
      const updated = await db.updateReportSchedule(input.id, updateData);
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Updated report schedule ${input.id}`,
        actionType: "admin_action",
        description: `Admin updated report schedule configuration`,
      });
      
      return updated;
    }),
    
    delete: adminProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const schedule = await db.getReportScheduleById(input.id);
      const success = await db.deleteReportSchedule(input.id);
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `Deleted report schedule ${input.id}`,
        actionType: "admin_action",
        description: `Admin deleted report schedule: ${schedule?.name || 'Unknown'}`,
      });
      
      return { success };
    }),
    
    toggle: adminProcedure.input(z.object({
      id: z.number(),
      isEnabled: z.boolean(),
    })).mutation(async ({ input, ctx }) => {
      const updated = await db.updateReportSchedule(input.id, { isEnabled: input.isEnabled });
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "Admin",
        action: `${input.isEnabled ? 'Enabled' : 'Disabled'} report schedule ${input.id}`,
        actionType: "admin_action",
        description: `Admin ${input.isEnabled ? 'enabled' : 'disabled'} report schedule`,
      });
      
      return updated;
    }),
    
    runNow: adminProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const schedule = await db.getReportScheduleById(input.id);
      if (!schedule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found' });
      }
      
      try {
        const endDate = new Date();
        const startDate = new Date();
        if (schedule.reportType === 'monthly') {
          startDate.setMonth(startDate.getMonth() - 1);
        } else if (schedule.reportType === 'quarterly') {
          startDate.setMonth(startDate.getMonth() - 3);
        } else if (schedule.reportType === 'weekly') {
          startDate.setDate(startDate.getDate() - 7);
        } else {
          startDate.setMonth(startDate.getMonth() - 1);
        }
        
        const allUsers = await db.getAllUsers();
        const allLogs = await db.getAllActivityLogs();
        
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter(u => u.status === "active").length;
        const pendingKYC = allUsers.filter(u => u.kycStatus === "pending").length;
        const approvedKYC = allUsers.filter(u => u.kycStatus === "approved").length;
        const rejectedKYC = allUsers.filter(u => u.kycStatus === "rejected").length;
        const activeSessions = allLogs.filter(l => l.actionType === "login").length;
        
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
        const userGrowthData = months.map((month, index) => ({
          month,
          count: Math.floor(totalUsers * (0.5 + index * 0.1)),
        }));
        
        const kycApprovalData = months.map((month) => ({
          month,
          approved: Math.floor(approvedKYC / 6),
          rejected: Math.floor(rejectedKYC / 6),
        }));
        
        const serviceUsageData = [
          { service: "Moodle LMS", connections: Math.floor(totalUsers * 0.6) },
          { service: "Mobile App", connections: Math.floor(totalUsers * 0.8) },
          { service: "Admin Portal", connections: Math.floor(totalUsers * 0.3) },
        ];
        
        const recentUsers = allUsers.slice(0, 20);
        
        const reportData = {
          totalUsers,
          activeUsers,
          pendingKYC,
          approvedKYC,
          rejectedKYC,
          activeSessions,
          userGrowthData,
          kycApprovalData,
          serviceUsageData,
          recentUsers,
          dateRange: { start: startDate, end: endDate },
          reportType: schedule.reportType as "monthly" | "quarterly",
        };
        
        const pdfBuffer = await generatePDFReport(reportData);
        
        const recipients = JSON.parse(schedule.recipientEmails);
        await sendScheduledReportEmail(
          recipients,
          schedule.name,
          schedule.reportType,
          pdfBuffer
        );
        
        const nextRunAt = calculateNextRunTime(
          schedule.frequency,
          schedule.dayOfWeek ?? undefined,
          schedule.dayOfMonth ?? undefined,
          schedule.timeOfDay || "09:00"
        );
        
        await db.updateReportSchedule(input.id, {
          lastRunAt: new Date(),
          nextRunAt,
          lastStatus: "success",
          lastError: null,
        });
        
        await db.createActivityLog({
          userId: ctx.user.id,
          username: ctx.user.name || ctx.user.email || "Admin",
          action: `Manually ran report schedule: ${schedule.name}`,
          actionType: "admin_action",
          description: `Admin manually triggered ${schedule.reportType} report generation`,
        });
        
        return { success: true, message: `Report sent to ${recipients.length} recipient(s)` };
      } catch (error) {
        await db.updateReportSchedule(input.id, {
          lastRunAt: new Date(),
          lastStatus: "failed",
          lastError: error instanceof Error ? error.message : "Unknown error",
        });
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate report',
        });
      }
    }),
  }),

  // ============= PROFILE =============
  profile: router({
    update: protectedProcedure.input(z.object({
      nameKhmer: z.string().optional(),
      nameEnglish: z.string().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
      photoUrl: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const updated = await db.updateUser(ctx.user.id, input);
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "User",
        action: "Updated profile",
        actionType: "profile_update",
        description: "User updated their profile information",
      });
      
      return updated;
    }),
    
    updatePin: protectedProcedure.input(z.object({
      pin: z.string().length(6),
    })).mutation(async ({ input, ctx }) => {
      const updated = await db.updateUser(ctx.user.id, { pin: input.pin });
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "User",
        action: "Changed PIN",
        actionType: "profile_update",
        description: "User changed their PIN",
      });
      
      return { success: true };
    }),
    
    toggleBiometric: protectedProcedure.input(z.object({
      enabled: z.boolean(),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUser(ctx.user.id, { biometricEnabled: input.enabled });
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "User",
        action: `${input.enabled ? 'Enabled' : 'Disabled'} biometric authentication`,
        actionType: "profile_update",
        description: `User ${input.enabled ? 'enabled' : 'disabled'} biometric authentication`,
      });
      
      return { success: true };
    }),
    
    toggle2FA: protectedProcedure.input(z.object({
      enabled: z.boolean(),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUser(ctx.user.id, { twoFactorEnabled: input.enabled });
      
      await db.createActivityLog({
        userId: ctx.user.id,
        username: ctx.user.name || ctx.user.email || "User",
        action: `${input.enabled ? 'Enabled' : 'Disabled'} 2FA`,
        actionType: "profile_update",
        description: `User ${input.enabled ? 'enabled' : 'disabled'} two-factor authentication`,
      });
      
      return { success: true };
    }),
  }),
});


export type AppRouter = typeof appRouter;