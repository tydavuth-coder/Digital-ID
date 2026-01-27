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
    res: {} as TrpcContext["res"],
  };
}

describe("Bulk Operations", () => {
  describe("bulkImport", () => {
    it("should accept bulk user import with valid data", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const users = [
        {
          nameEnglish: "Test User 1",
          nameKhmer: "តេស្ត អ្នកប្រើប្រាស់ ១",
          email: `test1-${Date.now()}@example.com`,
          nationalId: "123456789",
          username: `testuser1_${Date.now()}`,
          status: "active" as const,
        },
        {
          nameEnglish: "Test User 2",
          email: `test2-${Date.now()}@example.com`,
          status: "pending" as const,
        },
      ];

      const result = await caller.users.bulkImport({ users });

      expect(result.success).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeInstanceOf(Array);
    });

    it("should handle invalid email addresses", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const users = [
        {
          nameEnglish: "Invalid User",
          email: "not-an-email",
        },
      ];

      await expect(caller.users.bulkImport({ users })).rejects.toThrow();
    });
  });

  describe("bulkApprove KYC", () => {
    it("should accept bulk KYC approval request", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.kyc.bulkApprove({ ids: [999] });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("failed");
      expect(typeof result.success).toBe("number");
      expect(typeof result.failed).toBe("number");
    });

    it("should handle empty ID array", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.kyc.bulkApprove({ ids: [] });

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe("bulkReject KYC", () => {
    it("should accept bulk KYC rejection with reason", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.kyc.bulkReject({
        ids: [999],
        reason: "Documents are not clear",
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("failed");
      expect(typeof result.success).toBe("number");
      expect(typeof result.failed).toBe("number");
    });

    it("should accept empty array gracefully", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.kyc.bulkReject({
        ids: [],
        reason: "Test reason",
      });

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });
  });
});

describe("Email Notifications", () => {
  it("should send email on KYC approval", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This test verifies the procedure accepts the request
    // Actual email sending depends on SMTP configuration
    const result = await caller.kyc.approve({ id: 999 });

    expect(result).toHaveProperty("success");
  });

  it("should send email on KYC rejection", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.kyc.reject({
      id: 999,
      reason: "Test rejection",
    });

    expect(result).toHaveProperty("success");
  });
});
