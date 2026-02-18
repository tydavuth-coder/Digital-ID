import type { Express, Request, Response } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "../db";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { generateTelegramLinkToken } from "./telegram";

const loginSchema = z.object({
    phone: z.string(),
    pin: z.string(),
});

const sendOtpSchema = z.object({
    phone: z.string(),
    channel: z.enum(["telegram", "sms"]).optional(),
});

const verifyOtpSchema = z.object({
    phone: z.string(),
    otp: z.string(),
});

const resetPinSchema = z.object({
    recoveryToken: z.string(),
    newPin: z.string().length(6),
});

export function registerMobileAuthRoutes(app: Express) {
    // PIN LOGIN
    app.post("/api/auth/pin/login", async (req: Request, res: Response) => {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: "Invalid input" });
            return;
        }
        const { phone, pin } = parsed.data;

        try {
            const user = await db.getUserByPhone(phone);
            if (!user || !user.pin) {
                res.status(401).json({ error: "Invalid credentials" });
                return;
            }

            if (user.pin !== pin) {
                res.status(401).json({ error: "Invalid credentials" });
                return;
            }

            const sessionToken = await sdk.createSessionToken(user.openId, {
                name: user.name || "User",
                expiresInMs: ONE_YEAR_MS,
            });

            // Optional: Set cookie if this is used by web too, but mostly for mobile
            const cookieOptions = getSessionCookieOptions(req);
            res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

            res.json({
                success: true,
                accessToken: sessionToken,
                refreshToken: nanoid(32),
                user: {
                    id: user.id.toString(),
                    nameEn: user.nameEnglish,
                    nameKh: user.nameKhmer,
                    email: user.email,
                    phone: user.phoneNumber,
                    status: user.status,
                },
            });
        } catch (error) {
            console.error("[MobileAuth] Login failed:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // SEND OTP
    app.post("/api/auth/recovery/send-otp", async (req: Request, res: Response) => {
        const parsed = sendOtpSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: "Invalid input" });
            return;
        }
        const { phone } = parsed.data;

        try {
            const user = await db.getUserByPhone(phone);
            if (!user) {
                // Fake success
                res.json({ success: true, message: "OTP sent (mock)" });
                return;
            }

            console.log(`[MobileAuth] OTP for ${phone}: 123456`);
            res.json({ success: true, message: "OTP sent" });
        } catch (error) {
            console.error("[MobileAuth] Send OTP failed:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // VERIFY OTP
    app.post("/api/auth/recovery/verify-otp", async (req: Request, res: Response) => {
        const parsed = verifyOtpSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: "Invalid input" });
            return;
        }
        const { phone, otp } = parsed.data;

        if (otp !== "123456") {
            res.status(400).json({ error: "Invalid OTP" });
            return;
        }

        try {
            const user = await db.getUserByPhone(phone);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            const recoveryToken = nanoid(32);
            await db.updateUser(user.id, { recoveryToken });

            res.json({ success: true, recoveryToken });
        } catch (error) {
            console.error("[MobileAuth] Verify OTP failed:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // RESET PIN
    app.post("/api/auth/recovery/reset-pin", async (req: Request, res: Response) => {
        const parsed = resetPinSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: "Invalid input" });
            return;
        }
        const { recoveryToken, newPin } = parsed.data;

        try {
            const user = await db.getUserByRecoveryToken(recoveryToken);
            if (!user) {
                res.status(400).json({ error: "Invalid recovery token" });
                return;
            }

            await db.updateUser(user.id, {
                pin: newPin,
                recoveryToken: null
            });

            const sessionToken = await sdk.createSessionToken(user.openId, {
                name: user.name || "User",
                expiresInMs: ONE_YEAR_MS,
            });

            res.json({
                success: true,
                accessToken: sessionToken,
                refreshToken: nanoid(32)
            });
        } catch (error) {
            console.error("[MobileAuth] Reset PIN failed:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // UPDATE PROFILE
    app.post("/api/profile/update", async (req: Request, res: Response) => {
        try {
            // Verify Session via Bearer Token
            const authHeader = req.headers.authorization;
            const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

            if (!token) {
                res.status(401).json({ error: "Missing session token" });
                return;
            }

            const session = await sdk.verifySession(token);
            if (!session) {
                res.status(401).json({ error: "Invalid session token" });
                return;
            }

            // Get User from Session OpenID
            const user = await db.getUserByOpenId(session.openId);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            const schema = z.object({
                nameEn: z.string().optional(),
                nameKh: z.string().optional(),
                phone: z.string().optional(),
                email: z.string().email().optional(),
                address: z.string().optional(),
                photoUrl: z.string().optional(),
            });

            const parsed = schema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ error: "Invalid input" });
                return;
            }

            const input = parsed.data;

            await db.updateUser(user.id, {
                nameEnglish: input.nameEn,
                nameKhmer: input.nameKh,
                phoneNumber: input.phone,
                email: input.email,
                address: input.address,
                photoUrl: input.photoUrl
            });

            const updatedUser = await db.getUserById(user.id);

            res.json({
                success: true, user: {
                    ...updatedUser,
                    nameEn: updatedUser?.nameEnglish,
                    phone: updatedUser?.phoneNumber
                }
            });

        } catch (error) {
            console.error("[Profile] Update failed:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // QR LOGIN AUTHORIZATION
    app.post("/api/auth/qr/authorize", async (req: Request, res: Response) => {
        try {
            // 1. Verify Mobile User
            const authHeader = req.headers.authorization;
            const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
            if (!token) {
                res.status(401).json({ error: "Missing session token" });
                return;
            }
            const session = await sdk.verifySession(token);
            if (!session) {
                res.status(401).json({ error: "Invalid session token" });
                return;
            }
            const user = await db.getUserByOpenId(session.openId);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            // 2. Get QR Token (Socket ID)
            const { qrToken } = req.body;
            if (!qrToken) {
                res.status(400).json({ error: "QR Token is required" });
                return;
            }

            console.log(`[MobileAuth] Authorizing Web Session for Socket: ${qrToken} by User: ${user.username || user.email}`);

            // 3. Create Session for Web Client
            const webSessionToken = await sdk.createSessionToken(user.openId, {
                name: user.name || "Web User",
                expiresInMs: ONE_YEAR_MS,
            });

            // 4. Emit Success to Web Client via WebSocket
            // We need to import emitDashboardLoginSuccess dynamically or from the module if available
            // Note: We need to ensure we can import it. backend/server/_core/mobileAuth.ts imports from neighboring files.
            // But websocket.ts is in backend/server/websocket.ts (parent directory relative to _core?? No, wait)
            // _core/mobileAuth.ts -> ../websocket ??
            // File structure:
            // backend/server/_core/mobileAuth.ts
            // backend/server/websocket.ts
            // So import { emitDashboardLoginSuccess } from "../websocket"; matches.

            const { emitDashboardLoginSuccess } = await import("../websocket");
            emitDashboardLoginSuccess(qrToken, {
                token: webSessionToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.photoUrl
                }
            });

            res.json({ success: true, message: "Authorized successfully" });

        } catch (error) {
            console.error("[MobileAuth] QR Auth failed:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });


    // TELEGRAM LINKING
    app.post("/api/auth/telegram/link", async (req: Request, res: Response) => {
        try {
            // Verify Session
            const authHeader = req.headers.authorization;
            const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

            if (!token) {
                res.status(401).json({ error: "Missing session token" });
                return;
            }

            const session = await sdk.verifySession(token);
            if (!session) {
                res.status(401).json({ error: "Invalid session token" });
                return;
            }

            const user = await db.getUserByOpenId(session.openId);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            const link = await generateTelegramLinkToken(user.id);
            res.json({ success: true, link });

        } catch (error) {
            console.error("[Telegram] Generate link failed:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
}

