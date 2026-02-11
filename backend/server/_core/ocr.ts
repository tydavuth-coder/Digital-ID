import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

export interface ExtractedIdData {
  nationalId?: string;
  nameKh?: string;
  nameEn?: string;
  dob?: string;
  expiryDate?: string;
}

export async function extractDataFromID(imageBase64: string): Promise<ExtractedIdData> {
  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, 'base64');

    const [result] = await client.textDetection(buffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) return {};

    const fullText = detections[0].description || "";
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const data: ExtractedIdData = {};

    console.log("OCR Raw Text:", fullText);

    // ១. រកលេខអត្តសញ្ញាណប័ណ្ណ (9-10 ខ្ទង់)
    const idMatch = fullText.match(/\b\d{9,10}\b/);
    if (idMatch) data.nationalId = idMatch[0];

    // ២. រកថ្ងៃខែ (Format: dd.mm.yyyy)
    const dateMatches = fullText.match(/(\d{2}[./-]\d{2}[./-]\d{4})/g);
    if (dateMatches && dateMatches.length > 0) {
      data.dob = dateMatches[0]; // ថ្ងៃដំបូងជាថ្ងៃកំណើត
      if (dateMatches.length > 1) data.expiryDate = dateMatches[1];
    }

    // ៣. រកឈ្មោះអង់គ្លេស (ALL CAPS)
    // Logic: ឈ្មោះអង់គ្លេសជាធម្មតានៅខាងលើលេខ ID បន្តិច ឬជាបន្ទាត់ដែលមានអក្សរធំសុទ្ធ
    const ignoreEn = ["KINGDOM", "CAMBODIA", "NATIONAL", "ID", "CARD", "KHMER", "OF", "NAME", "SEX", "DATE", "PLACE", "HEIGHT"];
    
    for (const line of lines) {
        // ត្រូវតែជាអក្សរ A-Z ធំសុទ្ធ, មានដកឃ្លា, មិនមានលេខ
        if (/^[A-Z\s]+$/.test(line) && line.length > 5 && line.includes(" ")) {
            const isIgnored = ignoreEn.some(ig => line.includes(ig));
            if (!isIgnored) {
                data.nameEn = line;
                break; // យកតែឈ្មោះដំបូងគេដែលត្រូវលក្ខខណ្ឌ
            }
        }
    }

    // ៤. រកឈ្មោះខ្មែរ (Logic: រកបន្ទាត់ដែលមានអក្សរខ្មែរ តែមិនមែនជា Header)
    const ignoreKh = ["ព្រះរាជាណាចក្រកម្ពុជា", "ជាតិ", "សាសនា", "ព្រះមហាក្សត្រ", "អត្តសញ្ញាណប័ណ្ណ", "មានសុពលភាព", "លេខ", "កម្ពស់", "ភេទ", "ថ្ងៃខែឆ្នាំកំណើត"];
    
    for (const line of lines) {
        const hasKhmer = /[\u1780-\u17FF]/.test(line);
        if (hasKhmer) {
            const isHeader = ignoreKh.some(header => line.includes(header));
            // បើមានអក្សរខ្មែរ ហើយមិនមែនជា Header -> យកធ្វើជាឈ្មោះ
            if (!isHeader && line.length < 50) {
                // សម្អាតពាក្យនាំមុខដូចជា "ឈ្មោះ" ឬ "ត្រកូល" ចេញ
                data.nameKh = line.replace(/^(ឈ្មោះ|ត្រកូល|នាម)[:\s]*/g, "").trim();
                break; 
            }
        }
    }

    return data;
  } catch (error) {
    console.error("OCR Error:", error);
    return {}; 
  }
}