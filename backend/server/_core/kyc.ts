import type { Express, Request, Response } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "../db";
import { getIO } from "../websocket";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";

// Initialize Vision Client
// Note: We use process.cwd() to find service-account.json in the backend root
const client = new ImageAnnotatorClient({
  keyFilename: path.join(process.cwd(), "service-account.json"),
});

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
  phoneNumber: z.string().optional(),
});

/**
 * Extracts data from the raw text returned by Google Cloud Vision
 */
function extractDataFromText(text: string) {
  console.log("📝 [KYC] Raw Vision API Text:\n", text);

  const extracted = {
    nameEn: "",
    nameKh: "",
    idNumber: "",
    dob: "",
    expiryDate: "",
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    // 1. ID Number (9 or 10 digits)
    if (!extracted.idNumber) {
      const cleanLine = line.replace(/\s/g, '');
      const idMatch = cleanLine.match(/\b\d{9,10}\b/);
      if (idMatch) {
        extracted.idNumber = idMatch[0];
        console.log("   -> Found ID:", extracted.idNumber);
      }
    }

    // 2. Dates (DOB / Expiry)
    // Supports Khmer Numerals ០-៩ and Arabic digits
    const toArabic = (str: string) => str.replace(/[\u17E0-\u17E9]/g, (d) => String(d.charCodeAt(0) - 0x17E0));
    const datePatternMixed = /\b[\d\u17E0-\u17E9]{2}[./][\d\u17E0-\u17E9]{2}[./][\d\u17E0-\u17E9]{4}\b/g;

    const dateMatches = line.match(datePatternMixed);
    if (dateMatches) {
      for (const dateRaw of dateMatches) {
        const date = toArabic(dateRaw);
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
    // All caps, length > 4, no forbidden keywords
    if (!extracted.nameEn && /^[A-Z\s]+$/.test(line) && line.length > 4) {
      const forbidden = ["KINGDOM", "CAMBODIA", "IDENTITY", "CARD", "KHMER", "NATIONAL", "SOCIALIST", "REPULIC"];
      const hasForbidden = forbidden.some(w => line.toUpperCase().includes(w));

      if (!hasForbidden) {
        extracted.nameEn = line.replace(/\s+/g, ' ').trim();
        console.log("   -> Found Name (EN):", extracted.nameEn);
      }
    }

    // 4. Name (Khmer)
    // Basic Khmer Unicode range \u1780-\u17FF
    if (!extracted.nameKh && /[\u1780-\u17FF]/.test(line)) {
      if (line.length > 3 && !line.includes("ព្រះរាជាណាចក្រ") && !line.includes("អត្តសញ្ញាណប័ណ្ណ")) {
        extracted.nameKh = line;
        console.log("   -> Found Name (KH):", extracted.nameKh);
      }
    }
  }

  return extracted;
}

export function registerKycRoutes(app: Express) {
  const handler = async (req: Request, res: Response) => {
    // Extend timeout for OCR processing
    req.socket.setTimeout(120000);

    const parsed = kycSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid Input" });
      return;
    }

    const input = parsed.data;
    let extractedData = {};

    try {
      if (input.frontImage && input.frontImage.startsWith("data:image")) {
        console.log("🔍 [KYC] Executing Google Cloud Vision OCR...");
        try {
          const base64Data = input.frontImage.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');

          // Google Cloud Vision Text Detection
          const [result] = await client.textDetection(buffer);
          const detections = result.textAnnotations;

          if (detections && detections.length > 0) {
            const fullText = detections[0].description || "";
            extractedData = extractDataFromText(fullText);
          } else {
            console.log("⚠️ [KYC] Vision API detected no text.");
          }
        } catch (ocrError) {
          console.error("❌ [KYC] Vision API Error:", ocrError);
        }
      }

      const finalNameEn = input.nameEn || (extractedData as any).nameEn;
      const finalIdNumber = input.idNumber || (extractedData as any).idNumber;

      // Unique OpenId for tracking
      const openId = `user_${nanoid(10)}`;

      await db.upsertUser({
        openId: openId,
        name: finalNameEn || "New User",
        email: `temp_${nanoid(5)}@digitalid.local`,
        phoneNumber: input.phoneNumber,
      });

      const createdUser = await db.getUserByOpenId(openId);
      if (!createdUser) {
        res.status(500).json({ success: false, error: "User Creation Failed" });
        return;
      }

      const userId = createdUser.id;
      const updateData: any = {
        nameKhmer: (extractedData as any).nameKh || input.nameKh,
        nameEnglish: finalNameEn,
        gender: input.gender,
        address: input.address,
        status: "pending",
        kycStatus: "pending",
        role: "user",
      };

      if (finalIdNumber) {
        updateData.nationalId = finalIdNumber;
      }

      await db.updateUser(userId, updateData);

      // Store file references (base64 for now as per current schema)
      await db.createKycDocument({
        userId: userId,
        nidFrontUrl: input.frontImage || "",
        nidBackUrl: input.backImage || "",
        selfieUrl: input.selfieImage || "",
      });

      await db.createActivityLog({
        userId: userId,
        username: finalNameEn || "New Applicant",
        action: "KYC Submission",
        actionType: "kyc_submit",
        description: "Registration via Mobile App.",
      });

      // Notify WebSocket clients (Admin Dashboard)
      try {
        const io = getIO();
        io.to("admins").emit("kyc-submission", {
          userId: userId,
          userName: finalNameEn,
          timestamp: new Date(),
        });
      } catch (wsError) {
        console.warn("⚠️ WebSocket notification failed.");
      }

      res.json({
        success: true,
        userId: userId,
        extractedData: extractedData
      });

    } catch (error) {
      console.error("❌ [KYC] Fatal Submit Error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  };

  app.post("/api/kyc/submit", handler);
  app.post("/kyc/submit", handler);
}