import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with KYC fields for Digital ID system.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "kyc_reviewer", "system_admin", "super_admin"]).default("user").notNull(),
  
  // Digital ID specific fields
  nameKhmer: text("nameKhmer"),
  nameEnglish: text("nameEnglish"),
  nationalId: varchar("nationalId", { length: 64 }).unique(),
  
  // ✅ (ថ្មី) បន្ថែម field នេះដើម្បីកុំឱ្យ Error ពេល Save ថ្ងៃកំណើត
  dob: varchar("dob", { length: 50 }),

  username: varchar("username", { length: 64 }).unique(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  address: text("address"),
  photoUrl: text("photoUrl"),
  status: mysqlEnum("status", ["active", "pending", "blocked"]).default("pending").notNull(),
  kycStatus: mysqlEnum("kycStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  
  // Security fields
  pin: varchar("pin", { length: 255 }),
  biometricEnabled: boolean("biometricEnabled").default(false),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false),
  telegramChatId: varchar("telegramChatId", { length: 64 }),
  
  // Digital ID verification
  digitalIdVerified: boolean("digitalIdVerified").default(false),
  
  // ✅ (កែប្រែ) ប្តូរពី timestamp ទៅ varchar ដើម្បីទទួលយកអក្សរពី OCR បាន
  idExpiryDate: varchar("idExpiryDate", { length: 50 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ... (ផ្នែកខាងក្រោមរក្សាទុកដដែល មិនបាច់កែទេ)
export const kycDocuments = mysqlTable("kycDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nidFrontUrl: text("nidFrontUrl").notNull(),
  nidBackUrl: text("nidBackUrl").notNull(),
  selfieUrl: text("selfieUrl").notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  nameKhmer: text("nameKhmer"),
  nameEnglish: text("nameEnglish"),
  description: text("description"),
  logoUrl: text("logoUrl"),
  token: varchar("token", { length: 255 }).notNull().unique(),
  secret: varchar("secret", { length: 255 }).notNull(),
  callbackUrl: text("callbackUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userServices = mysqlTable("userServices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serviceId: int("serviceId").notNull(),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
});

export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  username: varchar("username", { length: 64 }),
  action: varchar("action", { length: 255 }).notNull(),
  actionType: mysqlEnum("actionType", ["login", "logout", "kyc_submit", "kyc_approve", "kyc_reject", "service_connect", "service_disconnect", "qr_scan", "profile_update", "admin_action", "other"]).notNull(),
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  maintenanceMode: boolean("maintenanceMode").default(false).notNull(),
  allowKycUserCreation: boolean("allowKycUserCreation").default(true).notNull(),
  telegramBotToken: text("telegramBotToken"),
  telegramBotId: varchar("telegramBotId", { length: 64 }),
  smsProvider: varchar("smsProvider", { length: 64 }),
  smsApiKey: text("smsApiKey"),
  smsApiSecret: text("smsApiSecret"),
  smsSenderId: varchar("smsSenderId", { length: 64 }),
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort").default(587),
  smtpSecure: boolean("smtpSecure").default(false),
  smtpUsername: varchar("smtpUsername", { length: 255 }),
  smtpPassword: text("smtpPassword"),
  smtpFromEmail: varchar("smtpFromEmail", { length: 320 }),
  smtpFromName: varchar("smtpFromName", { length: 255 }),
  smtpEnabled: boolean("smtpEnabled").default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export const activeSessions = mysqlTable("activeSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  deviceInfo: text("deviceInfo"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  titleKhmer: text("titleKhmer"),
  titleEnglish: text("titleEnglish"),
  message: text("message").notNull(),
  messageKhmer: text("messageKhmer"),
  messageEnglish: text("messageEnglish"),
  type: mysqlEnum("type", ["info", "success", "warning", "error"]).default("info").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const qrAuthTokens = mysqlTable("qrAuthTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serviceId: int("serviceId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  isUsed: boolean("isUsed").default(false).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

export const reportSchedules = mysqlTable("reportSchedules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  reportType: mysqlEnum("reportType", ["monthly", "quarterly", "weekly", "custom"]).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly", "quarterly"]).notNull(),
  dayOfWeek: int("dayOfWeek"),
  dayOfMonth: int("dayOfMonth"),
  timeOfDay: varchar("timeOfDay", { length: 5 }).default("09:00"),
  recipientEmails: text("recipientEmails").notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  lastStatus: mysqlEnum("lastStatus", ["success", "failed", "pending"]).default("pending"),
  lastError: text("lastError"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertKycDocument = typeof kycDocuments.$inferInsert;
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type UserService = typeof userServices.$inferSelect;
export type InsertUserService = typeof userServices.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = typeof systemSettings.$inferInsert;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type InsertActiveSession = typeof activeSessions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type QrAuthToken = typeof qrAuthTokens.$inferSelect;
export type InsertQrAuthToken = typeof qrAuthTokens.$inferInsert;
export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type InsertReportSchedule = typeof reportSchedules.$inferInsert;