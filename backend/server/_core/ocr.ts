import vision from '@google-cloud/vision';
import path from 'path';
import fs from 'fs';

// ១. កំណត់ទីតាំង Key (សំខាន់ណាស់!)
const keyPath = path.resolve(process.cwd(), 'service-account.json');

// ២. Check មើលថា Key មានឬអត់
if (fs.existsSync(keyPath)) {
  console.log("✅ FOUND Key file at:", keyPath);
} else {
  console.error("❌ ERROR: Key file NOT FOUND at:", keyPath);
}

// ៣. បង្កើត Client ដោយដាក់ Key ចូល
const client = new vision.ImageAnnotatorClient({
  keyFilename: keyPath
});

export interface ExtractedIdData {
  nationalId?: string;
  nameKh?: string;
  nameEn?: string;
  dob?: string;
  expiryDate?: string;
}

export async function extractDataFromID(imageBase64: string): Promise<ExtractedIdData> {
  try {
    // Validate Input
    if (!imageBase64 || typeof imageBase64 !== 'string') {
        console.error("❌ Invalid Image Input");
        return { nationalId: `ERR_INPUT_${Date.now()}` };
    }

    // សម្អាត Base64 Header
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, 'base64');

    console.log("📸 Sending image to Google Cloud...");
    const [result] = await client.textDetection(buffer);
    const detections = result.textAnnotations;

    // បើរកមិនឃើញអក្សរសោះ
    if (!detections || detections.length === 0) {
        console.log("⚠️ OCR returned no text.");
        // ដាក់លេខបន្លំ ដើម្បីកុំឱ្យ Database Error
        return { nationalId: `NOT_FOUND_${Date.now()}` };
    }

    const fullText = detections[0].description || "";
    console.log("📝 OCR Raw Text:", fullText.replace(/\n/g, " | "));

    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const data: ExtractedIdData = {};

    // ១. រកលេខអត្តសញ្ញាណប័ណ្ណ
    const idMatch = fullText.match(/\b\d{9,10}\b/);
    if (idMatch) {
        data.nationalId = idMatch[0];
    } else {
        // ⚠️ សំខាន់៖ បើរកលេខមិនឃើញ បង្កើតលេខបន្លំ ដើម្បីការពារ Error "Duplicate entry"
        console.warn("⚠️ No National ID found in text. Generating temporary ID.");
        data.nationalId = `UNKNOWN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    // ២. រកថ្ងៃខែ
    const dateMatches = fullText.match(/(\d{2}[./-]\d{2}[./-]\d{4})/g);
    if (dateMatches && dateMatches.length > 0) {
      data.dob = dateMatches[0];
      if (dateMatches.length > 1) data.expiryDate = dateMatches[1];
    }

    // ៣. រកឈ្មោះអង់គ្លេស
    const ignoreEn = ["KINGDOM", "CAMBODIA", "NATIONAL", "ID", "CARD", "KHMER", "OF", "NAME", "SEX", "DATE", "PLACE", "HEIGHT"];
    for (const line of lines) {
        if (/^[A-Z\s]+$/.test(line) && line.length > 5 && line.includes(" ")) {
            const isIgnored = ignoreEn.some(ig => line.includes(ig));
            if (!isIgnored) {
                data.nameEn = line;
                break;
            }
        }
    }

    // ៤. រកឈ្មោះខ្មែរ
    const ignoreKh = ["ព្រះរាជាណាចក្រកម្ពុជា", "ជាតិ", "សាសនា", "ព្រះមហាក្សត្រ", "អត្តសញ្ញាណប័ណ្ណ", "មានសុពលភាព", "លេខ", "កម្ពស់", "ភេទ", "ថ្ងៃខែឆ្នាំកំណើត"];
    for (const line of lines) {
        const hasKhmer = /[\u1780-\u17FF]/.test(line);
        if (hasKhmer) {
            const isHeader = ignoreKh.some(header => line.includes(header));
            if (!isHeader && line.length < 50) {
                data.nameKh = line.replace(/^(ឈ្មោះ|ត្រកូល|នាម)[:\s]*/g, "").trim();
                break; 
            }
        }
    }

    return data;
  } catch (error) {
    console.error("❌ OCR Error:", error);
    // Return random ID on error too
    return { nationalId: `ERR_OCR_${Date.now()}` }; 
  }
}