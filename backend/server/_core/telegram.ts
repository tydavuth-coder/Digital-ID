
import axios from "axios";
import { getSystemSettings, updateUser } from "../db";
import { nanoid } from "nanoid";

// Store link tokens in memory: Token -> UserId OR SessionId
// In production, use Redis. For this MVP, memory is fine (restart clears pending links).
const linkTokens = new Map<string, { userId?: number, sessionId?: string, expires: number }>();

// Store SessionId -> ChatId (Verified Sessions)
const sessionChats = new Map<string, string>();

export async function generateTelegramLinkToken(userId: number): Promise<string> {
    const token = nanoid(12);
    linkTokens.set(token, {
        userId,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    const settings = await getSystemSettings();
    const botId = settings?.telegramBotId || "DigitalID_OTP_Bot"; // Fallback or fetch from DB

    return `https://t.me/${botId}?start=${token}`;
}

export async function generateRegistrationLink(sessionId: string): Promise<string> {
    const token = nanoid(12);
    linkTokens.set(token, {
        sessionId,
        expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    const settings = await getSystemSettings();
    const botId = settings?.telegramBotId || "DigitalID_OTP_Bot";

    return `https://t.me/${botId}?start=${token}`;
}

export function checkRegistrationStatus(sessionId: string): string | null {
    return sessionChats.get(sessionId) || null;
}

export async function handleTelegramWebhook(update: any) {
    if (!update.message || !update.message.text) return;

    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text.startsWith("/start ")) {
        const token = text.split(" ")[1];
        if (!token) return;

        const stored = linkTokens.get(token);
        if (!stored) {
            await sendTelegramMessage(chatId, "⚠️ Link expired or invalid.");
            return;
        }

        if (Date.now() > stored.expires) {
            linkTokens.delete(token);
            await sendTelegramMessage(chatId, "⚠️ Link expired.");
            return;
        }

        // Case 1: Existing User Linking
        if (stored.userId) {
            await updateUser(stored.userId, { telegramChatId: chatId.toString() });
            linkTokens.delete(token);

            await sendTelegramMessage(chatId, "✅ Account successfully linked! You can now receive OTPs and notifications here.");
            console.log(`[Telegram] Linked user ${stored.userId} to chat ${chatId}`);
        }
        // Case 2: New Registration Linking
        else if (stored.sessionId) {
            sessionChats.set(stored.sessionId, chatId.toString());
            linkTokens.delete(token); // Consume token

            await sendTelegramMessage(chatId, "✅ Verification Successful! You can return to the app now.");
            console.log(`[Telegram] Verified session ${stored.sessionId} with chat ${chatId}`);
        }
    }
}

export async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
    try {
        const settings = await getSystemSettings();
        if (!settings || !settings.telegramBotToken) {
            console.warn("[Telegram] No bot token configured in system settings.");
            return false;
        }

        const token = settings.telegramBotToken;
        const url = `https://api.telegram.org/bot${token}/sendMessage`;

        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
        });

        return true;
    } catch (error) {
        console.error(`[Telegram] Failed to send message to ${chatId}:`, error);
        return false;
    }
}
