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

// Helper to extract data from OCR text
function extractDataFromText(text: string) {
  const extracted = {
    nameEn: "",
    nameKh: "",
    idNumber: "",
    dob: "",
    expiryDate: "",
  };

  const lines = text.split('\n');

  // Regex patterns (tuned for Cambodian ID cards based on samples)
  const idPattern = /\b\d{9,10}\b/; // 9 or 10 digit ID
  const datePattern = /\b\d{2}\.\d{2}\.\d{4}\b/; // DD.MM.YYYY
  // Name usually in caps, often after "Name" or on specific lines. 
  // Simple heuristic: Line with all caps that is NOT the header "KINGDOM OF CAMBODIA"

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // ID Number
    if (!extracted.idNumber) {
      const idMatch = trimmed.match(idPattern);
      if (idMatch) extracted.idNumber = idMatch[0];
    }

    // Dates (DOB / Expiry)
    // Usually DOB comes first, Expiry second in full text
    const dateMatch = trimmed.match(datePattern);
    if (dateMatch) {
      if (!extracted.dob) extracted.dob = dateMatch[0];
      else if (!extracted.expiryDate) extracted.expiryDate = dateMatch[0];
    }

    // Name (English) - Heuristic: All uppercase, length > 3, not a known keyword
    if (!extracted.nameEn && /^[A-Z\s]+$/.test(trimmed) && trimmed.length > 3) {
      if (!trimmed.includes("KINGDOM") && !trimmed.includes("CAMBODIA") && !trimmed.includes("IDENTITY") && !trimmed.includes("CARD")) {
        extracted.nameEn = trimmed;
      }
    }
  }

  return extracted;
}

export function registerKycRoutes(app: Express) {
  const handler = async (req: Request, res: Response) => {
    // Increase timeout for OCR
    req.socket.setTimeout(120000);

    const parsed = kycSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid Input" });
      return;
    }

    const input = parsed.data;
    let extractedData = {};

    try {
      // PERFORM OCR if front image occurs
      if (input.frontImage && input.frontImage.startsWith("data:image")) {
        console.log("🔍 Starting OCR on Front ID...");
        try {
          // Dynamic import to prevent startup crashes
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker('eng');
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
      });
      const createdUser = await db.getUserByOpenId(openId);
      if (!createdUser) {
        res.status(500).json({ success: false, error: "Database Error" });
        return;
      }

      const newUserId = createdUser.id;

      await db.updateUser(newUserId, {
        nameKhmer: input.nameKh,
        nameEnglish: finalNameEn,
        nationalId: finalIdNumber,
        gender: input.gender as any,
        address: input.address,
        status: "pending",
        kycStatus: "pending",
        role: "user",
      });

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

      // Return the extracted data to the frontend so it can populate the Review/Confirmation screen!
      res.json({
        success: true,
        userId: newUserId,
        extractedData: extractedData
      });

    } catch (error) {
      console.error("KYC Submit Error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  };

  app.post("/api/kyc/submit", handler);
  app.post("/kyc/submit", handler);
}