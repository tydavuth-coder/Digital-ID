import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@digitalid.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    nameKhmer: null,
    nameEnglish: "Admin User",
    nationalId: null,
    username: "admin",
    phoneNumber: null,
    gender: null,
    address: null,
    photoUrl: null,
    status: "active",
    kycStatus: "approved",
    pin: null,
    biometricEnabled: false,
    twoFactorEnabled: false,
    telegramChatId: null,
    digitalIdVerified: true,
    idExpiryDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Dashboard", () => {
  it("should return dashboard statistics for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.getStats();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("pendingKyc");
    expect(stats).toHaveProperty("activeUsers");
    expect(stats).toHaveProperty("activeSessions");
    expect(typeof stats.totalUsers).toBe("number");
    expect(typeof stats.pendingKyc).toBe("number");
    expect(typeof stats.activeUsers).toBe("number");
    expect(typeof stats.activeSessions).toBe("number");
  });

  it("should reject non-admin users from accessing dashboard stats", async () => {
    const { ctx } = createAdminContext();
    ctx.user!.role = "user";
    const caller = appRouter.createCaller(ctx);

    await expect(caller.dashboard.getStats()).rejects.toThrow("Admin access required");
  });
});

describe("User Management", () => {
  it("should allow admin to get all users", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const users = await caller.users.getAll();

    expect(Array.isArray(users)).toBe(true);
  });

  it("should reject non-admin from getting all users", async () => {
    const { ctx } = createAdminContext();
    ctx.user!.role = "user";
    const caller = appRouter.createCaller(ctx);

    await expect(caller.users.getAll()).rejects.toThrow("Admin access required");
  });
});

describe("Services", () => {
  it("should allow public access to active services", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.getActive();

    expect(Array.isArray(services)).toBe(true);
  });

  it("should allow admin to get all services including inactive", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.getAll();

    expect(Array.isArray(services)).toBe(true);
  });
});
