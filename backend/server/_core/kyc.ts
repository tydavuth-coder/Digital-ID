import type { Express, Request, Response } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "../db";
import { getIO } from "../websocket";

const kycSchema = z.object({
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
});

export function registerKycRoutes(app: Express) {
  const handler = async (req: Request, res: Response) => {
    console.log("[KYC] Received submission request");
    console.log("[KYC] Request body keys:", Object.keys(req.body));
    
    const parsed = kycSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("[KYC] Validation failed:", parsed.error.errors);
      res.status(400).json({ 
        success: false,
        error: "Invalid KYC payload",
        details: parsed.error.errors 
      });
      return;
    }

    const input = parsed.data;

    try {
      console.log("[KYC] Creating new user...");
      const openId = `user_${nanoid(10)}`;

      await db.upsertUser({
        openId: openId,
        name: input.nameEn,
        email: `temp_${nanoid(5)}@digitalid.local`,
      });
      
      const createdUser = await db.getUserByOpenId(openId);
      if (!createdUser) {
        console.error("[KYC] Failed to retrieve created user");
        res.status(500).json({ 
          success: false,
          error: "Failed to create user",
          message: "Database connection may not be available" 
        });
        return;
      }
      
      console.log(`[KYC] User created with ID: ${createdUser.id}`);

      await db.updateUser(createdUser.id, {
        nameKhmer: input.nameKh,
        nameEnglish: input.nameEn,
        nationalId: input.idNumber,
        gender: input.gender as any,
        address: input.address,
        status: "pending",
        kycStatus: "pending",
        role: "user",
      });

      const newUserId = createdUser.id;

      await db.createKycDocument({
        userId: newUserId,
        nidFrontUrl: input.frontImage || "",
        nidBackUrl: input.backImage || "",
        selfieUrl: input.selfieImage || "",
      });

      await db.createActivityLog({
        userId: newUserId,
        username: input.nameEn || "New Applicant",
        action: "Submitted KYC Registration",
        actionType: "kyc_submit",
        description: "New user application via Mobile App.",
      });

      try {
        const io = getIO();
        io.to("admins").emit("kyc-submission", {
          userId: newUserId,
          userName: input.nameEn,
          timestamp: new Date(),
        });
      } catch (e) {
        console.log("WebSocket notification warning:", e);
      }

      console.log(`[KYC] Successfully processed KYC submission for user ${newUserId}`);
      res.json({ success: true, userId: newUserId });
    } catch (error) {
      console.error("[KYC] Submit Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        success: false,
        error: "Failed to submit KYC application",
        message: errorMessage,
        hint: "Check if DATABASE_URL is configured in .env file"
      });
    }
  };

  app.post("/api/kyc/submit", handler);
  app.post("/kyc/submit", handler);
}