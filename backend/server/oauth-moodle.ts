import { Router } from "express";
import * as db from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";

export const moodleRouter = Router();

// Endpoint: /api/oauth/userinfo
// Moodle នឹងហៅមកទីនេះ បន្ទាប់ពីទទួលបាន Access Token
moodleRouter.get("/userinfo", async (req, res) => {
  try {
    // 1. Validate Token (ក្នុងករណីពិត ត្រូវ check Bearer token)
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    
    // Fake decoding for now (Replace with real JWT verification)
    const token = authHeader.split(" ")[1]; 
    // const decoded = verifyToken(token); 
    // const userId = decoded.id; 
    
    // Mock User ID for development (ត្រូវដូរដាក់ Logic ពិត)
    const userId = 1; 

    const user = await db.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Check KYC Status (Requirement: Only APPROVED)
    if (user.kycStatus !== "approved") {
      return res.status(403).json({ 
        error: "KYC_REQUIRED", 
        message: "Your account is not verified yet." 
      });
    }

    // 3. Return JSON mapped to Moodle requirements
    // Moodle ត្រូវការ field: username, email, firstname, lastname, idnumber
    res.json({
      sub: user.id, // Subject ID
      username: user.username,
      email: user.email,
      firstname: user.nameEnglish, // Map English Name
      lastname: user.nameKhmer,    // Map Khmer Name as lastname or vice versa
      idnumber: user.nationalId,   // ID Card Number
      department: "IT Department", // អាចទាញពី DB បន្ថែម
      picture: user.photoUrl,
      phone: user.phoneNumber
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});