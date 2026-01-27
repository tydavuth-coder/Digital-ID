import type { Express, Request, Response } from "express";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { getFirebaseAdmin } from "./firebaseAdmin";
import * as db from "../db";
import { sdk } from "./sdk";

const bodySchema = z.object({
  idToken: z.string().min(10),
});

export function registerFirebaseAuthRoutes(app: Express) {
  app.post("/api/auth/firebase/session", async (req: Request, res: Response) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "idToken is required" });
      return;
    }

    try {
      const admin = getFirebaseAdmin();
      const decoded = await admin.auth().verifyIdToken(parsed.data.idToken);

      const uid = decoded.uid;
      const email = decoded.email ?? null;
      const name = (decoded.name as string | undefined) || decoded.email || "User";

      await db.upsertUser({
        openId: uid,
        name,
        email,
        loginMethod: "firebase_email",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(uid, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({ success: true });
    } catch (e) {
      console.error("[FirebaseAuth] session failed:", e);
      res.status(401).json({ error: "Invalid Firebase token" });
    }
  });
}
