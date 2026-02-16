
import type { Express, Request, Response } from "express";
import { z } from "zod";
import * as db from "../db";
import { nanoid } from "nanoid";
import { sendTelegramMessage } from "./telegram";

// Simple In-Memory OTP Store (Shared instance for this module)
const otpStore = new Map<string, { code: string, expires: number }>();

export function registerRecoveryRoutes(app: Express) {

    // 1. Send OTP
    app.post("/api/auth/recovery/send-otp", async (req: Request, res: Response) => {
        try {
            const { phone } = req.body;

            if (!phone) {
                res.status(400).json({ success: false, message: "Phone number required" });
                return;
            }

            const user = await db.getUserByPhone(phone);
            if (!user) {
                // Return success to avoid user enumeration
                res.json({ success: true, message: "OTP sent" });
                return;
            }

            if (!user.telegramChatId) {
                console.log(`[Recovery] User ${phone} has no linked Telegram Chat ID.`);
                res.json({ success: false, message: "No linked Telegram account found." });
                return;
            }

            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // DEV DEBUG: Log OTP
            console.log(`[Recovery] Generated OTP for ${phone}: ${otp}`);

            // Store in Memory (Expires in 5 minutes)
            otpStore.set(phone, {
                code: otp,
                expires: Date.now() + 5 * 60 * 1000
            });

            // Send via Telegram
            const sent = await sendTelegramMessage(user.telegramChatId, `🔐 Your Recovery OTP is: *${otp}*\n\nValid for 5 minutes.`);

            if (sent) {
                console.log(`[Recovery] OTP sent to ${user.telegramChatId} for ${phone}`);
                res.json({ success: true, message: "OTP sent" });
            } else {
                res.status(500).json({ success: false, message: "Failed to send OTP via Telegram" });
            }

        } catch (error) {
            console.error("[Recovery] Send OTP Error:", error);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    });

    // 2. Verify OTP
    app.post("/api/auth/recovery/verify-otp", async (req: Request, res: Response) => {
        try {
            const { phone, otp } = req.body;

            const stored = otpStore.get(phone);

            if (!stored) {
                res.status(400).json({ success: false, message: "OTP expired or not found" });
                return;
            }

            if (Date.now() > stored.expires) {
                otpStore.delete(phone);
                res.status(400).json({ success: false, message: "OTP expired" });
                return;
            }

            if (stored.code !== otp) {
                res.status(400).json({ success: false, message: "Invalid OTP" });
                return;
            }

            // Consume OTP
            otpStore.delete(phone);

            const user = await db.getUserByPhone(phone);
            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }

            // Generate recovery token
            const recoveryToken = nanoid(32);
            await db.updateUser(user.id, { recoveryToken });

            res.json({ success: true, recoveryToken });

        } catch (error) {
            console.error("[Recovery] Verify OTP Error:", error);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    });

    // 3. Reset PIN
    app.post("/api/auth/recovery/reset-pin", async (req: Request, res: Response) => {
        try {
            const { recoveryToken, newPin } = req.body;

            if (!recoveryToken || !newPin || newPin.length !== 6) {
                res.status(400).json({ success: false, message: "Invalid input" });
                return;
            }

            const user = await db.getUserByRecoveryToken(recoveryToken);
            if (!user) {
                res.status(400).json({ success: false, message: "Invalid recovery token" });
                return;
            }

            // Update PIN and clear recovery token
            await db.updateUser(user.id, {
                pin: newPin,
                recoveryToken: null // One-time use
            });

            console.log(`[Recovery] PIN reset for user ${user.phoneNumber}`);
            res.json({ success: true, message: "PIN reset successful" });

        } catch (error) {
            console.error("[Recovery] Reset PIN Error:", error);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    });

}
