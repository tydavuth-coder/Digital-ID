import type { Express, Request, Response } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "../db";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

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
}
