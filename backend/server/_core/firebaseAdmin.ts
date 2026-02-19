import admin from "firebase-admin";

function getServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    return JSON.parse(json);
  }
  return null;
}

export function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const sa = getServiceAccount();
  if (sa) {
    admin.initializeApp({
      credential: admin.credential.cert(sa),
    });
  } else {
    // Fallback to default credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  return admin;
}
