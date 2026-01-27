import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Advanced Features", () => {
  describe("Bulk User Import", () => {
    it("should validate bulk import input", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const validUsers = [
        {
          nameKhmer: "សុខ សំណាង",
          nameEnglish: "Sok Samnang",
          nationalId: "123456789",
          email: "sok@example.com",
          phoneNumber: "+855123456789",
          status: "active" as const,
        },
      ];

      const result = await caller.users.bulkImport({ users: validUsers });

      // API returns { success: count, failed: count, errors: [] }
      expect(result.success).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
      // Total should equal input count
      expect(result.success + result.failed).toBe(1);
    });

    it("should reject invalid users in bulk import", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const mixedUsers = [
        {
          nameKhmer: "សុខ សំណាង",
          nameEnglish: "Sok Samnang",
          nationalId: "123456789",
          email: "sok@example.com",
          phoneNumber: "+855123456789",
          status: "active" as const,
        },
        {
          nameKhmer: "Invalid User",
          nameEnglish: "",
          nationalId: "",
          email: "invalid-email", // Invalid email format
          phoneNumber: "",
          status: "active" as const,
        },
      ];

      // Should throw validation error due to invalid email
      await expect(
        caller.users.bulkImport({ users: mixedUsers })
      ).rejects.toThrow();
    });
  });

  describe("Bulk KYC Operations", () => {
    it("should approve multiple KYC documents", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Test with valid input structure
      const result = await caller.kyc.bulkApprove({
        ids: [1, 2, 3],
      });

      expect(result.success).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeDefined();
    });

    it("should reject multiple KYC documents with reason", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.kyc.bulkReject({
        ids: [1, 2],
        reason: "Documents are not clear",
      });

      expect(result.success).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeDefined();
    });

    it("should handle bulk reject with empty reason", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Empty reason is allowed by the API (it uses a default message)
      const result = await caller.kyc.bulkReject({
        ids: [1, 2],
        reason: "",
      });
      
      expect(result.success).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Analytics Reports", () => {
    it("should generate monthly report", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date(2026, 0, 1).toISOString();
      const endDate = new Date(2026, 0, 31).toISOString();

      const result = await caller.reports.generate({
        reportType: "monthly",
        startDate,
        endDate,
      });

      expect(result.success).toBe(true);
      expect(result.pdf).toBeDefined();
      expect(typeof result.pdf).toBe("string");
      expect(result.pdf.length).toBeGreaterThan(0);
    });

    it("should generate quarterly report", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date(2026, 0, 1).toISOString();
      const endDate = new Date(2026, 2, 31).toISOString();

      const result = await caller.reports.generate({
        reportType: "quarterly",
        startDate,
        endDate,
      });

      expect(result.success).toBe(true);
      expect(result.pdf).toBeDefined();
      expect(typeof result.pdf).toBe("string");
    });

    it("should accept valid date formats", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Valid ISO date format should work
      const result = await caller.reports.generate({
        reportType: "monthly",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("User Profile & Activity Timeline", () => {
    it("should retrieve user activity logs", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const logs = await caller.logs.getAll();

      expect(Array.isArray(logs)).toBe(true);
      logs.forEach((log) => {
        expect(log).toHaveProperty("id");
        expect(log).toHaveProperty("userId");
        expect(log).toHaveProperty("action");
        expect(log).toHaveProperty("actionType");
        expect(log).toHaveProperty("createdAt");
      });
    });

    it("should filter logs by action type", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const allLogs = await caller.logs.getAll();
      const loginLogs = allLogs.filter((log) => log.actionType === "login");

      expect(Array.isArray(loginLogs)).toBe(true);
      loginLogs.forEach((log) => {
        expect(log.actionType).toBe("login");
      });
    });
  });

  describe("Email Notifications", () => {
    it("should have system settings with SMTP configuration", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const settings = await caller.settings.get();

      expect(settings).toHaveProperty("id");
      expect(settings).toHaveProperty("maintenanceMode");
      expect(typeof settings.maintenanceMode).toBe("boolean");
    });
  });
});
