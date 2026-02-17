import admin from "firebase-admin";
import path from "path";
import fs from "fs";

function getServiceAccount() {
  // 1. Try Environment Variable (JSON String)
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      // Remove potential wrapping quotes from .env parsers
      const cleanJson = json.replace(/^['"]|['"]$/g, '');
      console.log("[FirebaseAdmin] Attempting to parse FIREBASE_SERVICE_ACCOUNT_JSON...");
      return JSON.parse(cleanJson);
    } catch (e) {
      console.warn("[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back to file.", e);
    }
  }

  // 2. Try Local File (service-account.json)
  const localPath = path.join(process.cwd(), "service-account.json");
  if (fs.existsSync(localPath)) {
    try {
      console.log("[FirebaseAdmin] Found service-account.json at:", localPath);
      return JSON.parse(fs.readFileSync(localPath, "utf-8"));
    } catch (e) {
      console.error("[FirebaseAdmin] Failed to read service-account.json:", e);
    }
  }

  return null;
}

export function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const sa = getServiceAccount();
  if (sa) {
    console.log("[FirebaseAdmin] Initializing with explicit service account credentials.");
    admin.initializeApp({
      credential: admin.credential.cert(sa),
    });
  } else {
    console.log("[FirebaseAdmin] Initializing with Application Default Credentials.");
    // Fallback to default credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  return admin;
}
