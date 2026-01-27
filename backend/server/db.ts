import { eq, desc, and, sql, count, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  kycDocuments, InsertKycDocument,
  services, InsertService,
  userServices, InsertUserService,
  activityLogs, InsertActivityLog,
  systemSettings, InsertSystemSettings,
  activeSessions, InsertActiveSession,
  notifications, InsertNotification,
  qrAuthTokens, InsertQrAuthToken,
  reportSchedules, InsertReportSchedule
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER MANAGEMENT =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "nameKhmer", "nameEnglish", "nationalId", "username", "phoneNumber", "address", "photoUrl", "pin", "telegramChatId"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.status !== undefined) {
      values.status = user.status;
      updateSet.status = user.status;
    }
    if (user.kycStatus !== undefined) {
      values.kycStatus = user.kycStatus;
      updateSet.kycStatus = user.kycStatus;
    }
    if (user.gender !== undefined) {
      values.gender = user.gender;
      updateSet.gender = user.gender;
    }
    if (user.biometricEnabled !== undefined) {
      values.biometricEnabled = user.biometricEnabled;
      updateSet.biometricEnabled = user.biometricEnabled;
    }
    if (user.twoFactorEnabled !== undefined) {
      values.twoFactorEnabled = user.twoFactorEnabled;
      updateSet.twoFactorEnabled = user.twoFactorEnabled;
    }
    if (user.digitalIdVerified !== undefined) {
      values.digitalIdVerified = user.digitalIdVerified;
      updateSet.digitalIdVerified = user.digitalIdVerified;
    }
    if (user.idExpiryDate !== undefined) {
      values.idExpiryDate = user.idExpiryDate;
      updateSet.idExpiryDate = user.idExpiryDate;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUsersByStatus(status: "active" | "pending" | "blocked") {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.status, status)).orderBy(desc(users.createdAt));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set(data).where(eq(users.id, id));
  return await getUserById(id);
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(users).where(eq(users.id, id));
  return true;
}

// ============= KYC MANAGEMENT =============

export async function createKycDocument(doc: InsertKycDocument) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(kycDocuments).values(doc);
  return result;
}

export async function getKycDocumentByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingKycDocuments() {
  const db = await getDb();
  if (!db) return [];
  
  // Join with users table to get user information
  const result = await db
    .select({
      kycDoc: kycDocuments,
      user: users,
    })
    .from(kycDocuments)
    .leftJoin(users, eq(kycDocuments.userId, users.id))
    .where(eq(kycDocuments.verificationStatus, "pending"))
    .orderBy(desc(kycDocuments.createdAt));
  
  return result;
}

export async function updateKycStatus(
  id: number, 
  status: "approved" | "rejected", 
  verifiedBy: number,
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(kycDocuments).set({
    verificationStatus: status,
    verifiedBy,
    verifiedAt: new Date(),
    rejectionReason: rejectionReason || null,
  }).where(eq(kycDocuments.id, id));
  
  // Also update user's KYC status
  const doc = await db.select().from(kycDocuments).where(eq(kycDocuments.id, id)).limit(1);
  if (doc.length > 0) {
    await db.update(users).set({
      kycStatus: status,
      status: status === "approved" ? "active" : "pending",
      digitalIdVerified: status === "approved",
    }).where(eq(users.id, doc[0].userId));
  }
  
  return true;
}

// ============= SERVICE MANAGEMENT =============

export async function createService(service: InsertService) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(services).values(service);
  return result;
}

export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(services).orderBy(desc(services.createdAt));
}

export async function getActiveServices() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(services).where(eq(services.isActive, true)).orderBy(desc(services.createdAt));
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateService(id: number, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(services).set(data).where(eq(services.id, id));
  return await getServiceById(id);
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(services).where(eq(services.id, id));
  return true;
}

// ============= USER-SERVICE CONNECTIONS =============

export async function connectUserToService(userId: number, serviceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userServices).values({
    userId,
    serviceId,
  });
  return result;
}

export async function getUserServices(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      userService: userServices,
      service: services,
    })
    .from(userServices)
    .leftJoin(services, eq(userServices.serviceId, services.id))
    .where(eq(userServices.userId, userId))
    .orderBy(desc(userServices.connectedAt));
  
  return result;
}

export async function disconnectUserFromService(userId: number, serviceId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(userServices).where(
    and(
      eq(userServices.userId, userId),
      eq(userServices.serviceId, serviceId)
    )
  );
  return true;
}

// ============= ACTIVITY LOGS =============

export async function createActivityLog(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(activityLogs).values(log);
  return result;
}

export async function getAllActivityLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(1000);
}

export async function getUserActivityLogs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt)).limit(100);
}

export async function clearActivityLogs() {
  const db = await getDb();
  if (!db) return false;
  await db.delete(activityLogs);
  return true;
}

// ============= SYSTEM SETTINGS =============

export async function getSystemSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemSettings).limit(1);
  
  // If no settings exist, create default settings
  if (result.length === 0) {
    await db.insert(systemSettings).values({
      maintenanceMode: false,
      allowKycUserCreation: true,
    });
    const newResult = await db.select().from(systemSettings).limit(1);
    return newResult[0];
  }
  
  return result[0];
}

export async function updateSystemSettings(data: Partial<InsertSystemSettings>, updatedBy: number) {
  const db = await getDb();
  if (!db) return null;
  
  const settings = await getSystemSettings();
  if (!settings) return null;
  
  await db.update(systemSettings).set({
    ...data,
    updatedBy,
  }).where(eq(systemSettings.id, settings.id));
  
  return await getSystemSettings();
}

// ============= ACTIVE SESSIONS =============

export async function createSession(session: InsertActiveSession) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(activeSessions).values(session);
  return result;
}

export async function getActiveSessions() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return await db.select().from(activeSessions).where(sql`${activeSessions.expiresAt} > ${now}`).orderBy(desc(activeSessions.lastActivityAt));
}

export async function deleteSession(sessionToken: string) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(activeSessions).where(eq(activeSessions.sessionToken, sessionToken));
  return true;
}

// ============= NOTIFICATIONS =============

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  return true;
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  return true;
}

export async function getAllNotifications() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100);
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(notifications).where(eq(notifications.id, id));
  return true;
}

// ============= QR AUTH TOKENS =============

export async function createQrAuthToken(token: InsertQrAuthToken) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(qrAuthTokens).values(token);
  return result;
}

export async function getQrAuthToken(tokenValue: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(qrAuthTokens).where(eq(qrAuthTokens.token, tokenValue)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markQrTokenAsUsed(tokenValue: string) {
  const db = await getDb();
  if (!db) return false;
  await db.update(qrAuthTokens).set({ isUsed: true, usedAt: new Date() }).where(eq(qrAuthTokens.token, tokenValue));
  return true;
}

// ============= DASHBOARD STATISTICS =============

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [totalUsersResult] = await db.select({ count: count() }).from(users);
  const [pendingKycResult] = await db.select({ count: count() }).from(users).where(eq(users.kycStatus, "pending"));
  const [activeUsersResult] = await db.select({ count: count() }).from(users).where(eq(users.status, "active"));
  
  const activeSessionsList = await getActiveSessions();
  
  return {
    totalUsers: totalUsersResult?.count || 0,
    pendingKyc: pendingKycResult?.count || 0,
    activeUsers: activeUsersResult?.count || 0,
    activeSessions: activeSessionsList.length,
  };
}

// ============= REPORT SCHEDULES =============

export async function getAllReportSchedules() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reportSchedules).orderBy(desc(reportSchedules.createdAt));
}

export async function getReportScheduleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [schedule] = await db.select().from(reportSchedules).where(eq(reportSchedules.id, id)).limit(1);
  return schedule || null;
}

export async function createReportSchedule(data: InsertReportSchedule) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(reportSchedules).values(data);
  const insertId = result[0].insertId;
  return await getReportScheduleById(insertId);
}

export async function updateReportSchedule(id: number, data: Partial<InsertReportSchedule>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(reportSchedules).set(data).where(eq(reportSchedules.id, id));
  return await getReportScheduleById(id);
}

export async function deleteReportSchedule(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(reportSchedules).where(eq(reportSchedules.id, id));
  return true;
}

export async function getDueReportSchedules() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return await db.select().from(reportSchedules)
    .where(
      and(
        eq(reportSchedules.isEnabled, true),
        sql`${reportSchedules.nextRunAt} <= ${now}`
      )
    );
}
