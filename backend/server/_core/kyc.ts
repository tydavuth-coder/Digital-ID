import { Router, Request, Response } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "../db";
import { getIO } from "../websocket";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME } from "@shared/const";
import multer from "multer";

export const kycRouter = Router();

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

// Helper to extract data from OCR text
function extractDataFromText(text: string) {
  console.log("📝 Raw OCR Text for Extraction:\n", text); // Debug Log

  const extracted = {
    nameEn: "",
    nameKh: "",
    idNumber: "",
    dob: "",
    expiryDate: "",
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Regex patterns (tuned for Cambodian ID cards)
  const idPattern = /\b\d{9,10}\b/; // 9 or 10 digit ID
  // Date pattern: simplified to find any DD.MM.YYYY or DD/MM/YYYY
  const datePattern = /\b\d{2}[./]\d{2}[./]\d{4}\b/g;

  // Name Heuristics:
  // English: All CAPS, often multiple words, ignores common keywords
  // Khmer: Unicode range \u1780-\u17FF (Basic Khmer range)

  for (const line of lines) {
    // 1. ID Number
    if (!extracted.idNumber) {
      const idMatch = line.match(idPattern);
      if (idMatch) {
        extracted.idNumber = idMatch[0];
        console.log("   -> Found ID:", extracted.idNumber);
      }
    }

    // 2. Dates (DOB / Expiry)
    const dateMatches = line.match(datePattern);
    if (dateMatches) {
      for (const date of dateMatches) {
        // Very naive logic: First valid date is DOB, second is Expiry if DOB exists
        if (!extracted.dob) {
          extracted.dob = date;
          console.log("   -> Found DOB:", extracted.dob);
        } else if (!extracted.expiryDate && date !== extracted.dob) {
          extracted.expiryDate = date;
          console.log("   -> Found Expiry:", extracted.expiryDate);
        }
      }
    }

    // 3. Name (English)
    // Heuristic: Line is uppercase, > 3 chars, doesn't contain "KINGDOM" etc.
    if (!extracted.nameEn && /^[A-Z\s]+$/.test(line) && line.length > 4) {
      const forbidden = ["KINGDOM", "CAMBODIA", "IDENTITY", "CARD", "KHMER", "NATIONAL", "REPULIC", "SOCIALIST"];
      const hasForbidden = forbidden.some(w => line.includes(w));

      if (!hasForbidden) {
        extracted.nameEn = line;
        console.log("   -> Found Name (EN):", extracted.nameEn);
      }
    }
    // 4. Name (Khmer)
    if (!extracted.nameKh && /[\u1780-\u17FF]/.test(line)) {
      // Ignore header "Kingdom of Cambodia" or "ID Card" in Khmer if possible
      // Naive check: length > 3
      if (line.length > 3 && !line.includes("ព្រះរាជាណាចក្រ")) {
        extracted.nameKh = line;
        console.log("   -> Found Name (KH):", extracted.nameKh);
      }
    }
  }

  return extracted;
}

export function registerKycRoutes(app: Express) {
  const kycSchema = z.object({
    phoneNumber: z.string().optional(), // ✅ Add Phone Number
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

  const handler = async (req: Request, res: Response) => {
    // Increase timeout for OCR
    req.socket.setTimeout(120000);

    const parsed = kycSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid Input" });
      return;
    }

    const input = parsed.data;
    let extractedData: any = {};

    try {
      // PERFORM OCR if front image occurs
      if (input.frontImage && input.frontImage.startsWith("data:image")) {
        console.log("🔍 Starting OCR on Front ID...");
        try {
          // Dynamic import to prevent startup crashes
          const { createWorker } = await import("tesseract.js");
          // ✅ Initialize with English AND Khmer
          const worker = await createWorker(['eng', 'khm']);
          const ret = await worker.recognize(input.frontImage);
          console.log("✅ OCR Text:", ret.data.text);

          extractedData = extractDataFromText(ret.data.text);
          console.log("✅ Extracted Data:", extractedData);

          await worker.terminate();
        } catch (ocrError) {
          console.error("OCR Failed:", ocrError);
        }
      }

      // Use OCR data if input is missing, or prefer input if user edited it (logic depends on flow)
      // Here we prioritize what we extracted, but allow overrides if valid input was sent (handled by frontend usually sending empty or user-edited)
      // Actually, frontend sends what it has.

      const finalNameEn = input.nameEn || (extractedData as any).nameEn;
      const finalIdNumber = input.idNumber || (extractedData as any).idNumber;

      const openId = `user_${nanoid(10)}`;

      await db.upsertUser({
        openId: openId,
        name: finalNameEn || "New User",
        email: `temp_${nanoid(5)}@digitalid.local`,
        phoneNumber: input.phoneNumber, // ✅ Save Phone Number
      });
      const createdUser = await db.getUserByOpenId(openId);
      if (!createdUser) {
        res.status(500).json({ success: false, error: "Database Error" });
        return;
      }

      const newUserId = createdUser.id;

      const updateData: any = {
        nameKhmer: input.nameKh || (extractedData as any).nameKh, // ✅ Correctly use OCR Khmer Name
        nameEnglish: finalNameEn,
        gender: input.gender,
        address: input.address,
        status: "pending",
        kycStatus: "pending",
        role: "user",
      };

      // Only update nationalId if we actually have one (to avoid unique constraint errors on empty strings)
      if (finalIdNumber) {
        updateData.nationalId = finalIdNumber;
      }

      await db.updateUser(newUserId, updateData);

      await db.createKycDocument({
        userId: newUserId,
        nidFrontUrl: input.frontImage || "",
        nidBackUrl: input.backImage || "",
        selfieUrl: input.selfieImage || "",
      });

      await db.createActivityLog({
        userId: newUserId,
        username: finalNameEn || "New Applicant",
        action: "Submitted KYC Registration",
        actionType: "kyc_submit",
        description: "New user application via Mobile App.",
      });

      try {
        const io = getIO();
        io.to("admins").emit("kyc-submission", {
          userId: newUserId,
          userName: finalNameEn,
          timestamp: new Date(),
        });
      } catch (e) {
        console.log("WebSocket notification warning:", e);
      }

      // ✅ 7. Auto-Login (Create Session)
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
      const sessionToken = await sdk.createSessionToken(createdUser.openId, {
        name: createdUser.nameEnglish || createdUser.name || "User",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set Cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.status(200).json({
        success: true,
        userId: newUserId,
        accessToken: sessionToken, // ✅ Return Token
        user: createdUser,
        message: "KYC Submitted, Account Created & Logged In"
      });

    } catch (error) {
      console.error("KYC Submit Error:", error);
      res.status(500).json({ error: "Failed to submit KYC" });
    }
  };

  app.post("/api/kyc/submit", handler);
  app.post("/kyc/submit", handler);
}