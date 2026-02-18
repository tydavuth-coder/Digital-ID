
import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { kycDocuments, users } from "../drizzle/schema";
import { eq, like, and } from "drizzle-orm";

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not defined in .env");
    }

    console.log("🧹 Starting Cleanup...");
    console.log(`Connecting to database...`);

    let dbUrl = process.env.DATABASE_URL;

    // Fix: Force 127.0.0.1 to avoid Node.js IPv6 resolution issues with Laragon/MySQL
    if (dbUrl && dbUrl.includes("localhost")) {
        console.log("IPv6 Fix: Replacing localhost with 127.0.0.1");
        dbUrl = dbUrl.replace("localhost", "127.0.0.1");
    }

    const connection = await mysql.createConnection(dbUrl);
    const db = drizzle(connection);

    // 1. Delete Pending KYC Documents
    // We can't easily get the count of deleted rows with standard delete() in some drivers, 
    // but let's try to just run it.

    console.log("Deleting pending KYC documents...");
    await db.delete(kycDocuments).where(eq(kycDocuments.verificationStatus, "pending"));
    console.log("✅ Pending KYC documents deleted.");

    // 2. Delete Temporary Users
    console.log("Deleting temporary users (email starts with 'temp_' and status is 'pending')...");

    await db.delete(users).where(
        and(
            like(users.email, "temp_%"),
            eq(users.kycStatus, "pending")
        )
    );
    console.log("✅ Temporary users deleted.");

    await connection.end();
    console.log("✨ Cleanup Complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Cleanup Failed:", err);
    process.exit(1);
});
