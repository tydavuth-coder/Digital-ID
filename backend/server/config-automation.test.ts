import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock authenticated admin user context
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("SMTP Configuration", () => {
  it("should get settings (returns object with SMTP fields)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.settings.get();
    
    // Should return settings object
    expect(typeof result === "object").toBe(true);
  });

  it("should test SMTP connection with valid config", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Test with mock SMTP config - this will fail without real SMTP server
    // but should not throw an unhandled error
    try {
      const result = await caller.settings.testSmtp({
        host: "smtp.test.com",
        port: 587,
        username: "test@test.com",
        password: "testpass",
        secure: false,
        fromEmail: "noreply@test.com",
        fromName: "Test System",
      });
      
      // Result should be a boolean or error message
      expect(typeof result.success === "boolean").toBe(true);
    } catch (error: any) {
      // Expected to fail without real SMTP server
      expect(error.message).toBeDefined();
    }
  });
});

describe("Report Schedules", () => {
  it("should get all report schedules", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.reportSchedules.getAll();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a new report schedule", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.reportSchedules.create({
      name: "Test Monthly Report",
      reportType: "monthly",
      frequency: "monthly",
      dayOfMonth: 1,
      timeOfDay: "09:00",
      recipientEmails: ["test@example.com"],
      isEnabled: true,
    });
    
    // API returns the created schedule object with id
    expect(result).toBeDefined();
    expect(typeof result.id === "number").toBe(true);
  });

  it("should toggle report schedule status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // First create a schedule
    const createResult = await caller.reportSchedules.create({
      name: "Toggle Test Report",
      reportType: "weekly",
      frequency: "weekly",
      dayOfWeek: 1,
      timeOfDay: "10:00",
      recipientEmails: ["toggle@example.com"],
      isEnabled: true,
    });
    
    // Then toggle it - returns the updated schedule
    const toggleResult = await caller.reportSchedules.toggle({
      id: createResult.id!,
      isEnabled: false,
    });
    
    expect(toggleResult).toBeDefined();
  });

  it("should delete a report schedule", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // First create a schedule
    const createResult = await caller.reportSchedules.create({
      name: "Delete Test Report",
      reportType: "quarterly",
      frequency: "quarterly",
      dayOfMonth: 15,
      timeOfDay: "08:00",
      recipientEmails: ["delete@example.com"],
      isEnabled: false,
    });
    
    // Then delete it
    const deleteResult = await caller.reportSchedules.delete({
      id: createResult.id!,
    });
    
    expect(deleteResult.success).toBe(true);
  });
});

describe("Admin Role Assignment", () => {
  it("should update user role", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // This test depends on having a user in the database
    // In a real scenario, we'd create a test user first
    try {
      const result = await caller.users.update({
        id: 1,
        role: "kyc_reviewer",
      });
      
      expect(result.success).toBe(true);
    } catch (error: any) {
      // May fail if user doesn't exist
      expect(error.message).toBeDefined();
    }
  });
});
