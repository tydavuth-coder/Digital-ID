import { Router } from "express";
import axios from "axios";
import * as db from "../db";

export const telegramBotRouter = Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Webhook endpoint
telegramBotRouter.post("/webhook", async (req, res) => {
    try {
        const update = req.body;

        // Check if it's a message
        if (update.message) {
            const message = update.message;
            const chatId = message.chat.id;
            const text = message.text;
            const contact = message.contact;

            if (text === "/start") {
                await sendTelegramMessage(chatId, "👋 Welcome to Digital ID!\n\nPlease share your contact to link your account.", {
                    keyboard: [[{ text: "📱 Share Contact", request_contact: true }]],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                });
            }

            else if (contact) {
                // User shared contact
                const phoneNumber = contact.phone_number.replace('+', ''); // Normalize

                // Find user by phone
                // Flexible search: try with/without +, etc.
                // Assuming db has a function or we do it manually
                // Let's assume we store numbers cleanly.

                // In a real app, normalization is key. 
                // For now, let's try direct match.

                // We can't easily search "roughly" without more DB logic. 
                // Let's strip '+' from DB side if possible or search both.
                // db.getUserByPhone is likely strict.

                let user = await db.getUserByPhone(phoneNumber);
                if (!user && phoneNumber.startsWith('855')) {
                    // Try adding 0 if it's 855
                    user = await db.getUserByPhone('0' + phoneNumber.substring(3));
                }

                if (user) {
                    await db.updateUser(user.id, { telegramChatId: chatId.toString() });
                    await sendTelegramMessage(chatId, "✅ Account Linked Successfully!\n\nYou can now receive OTPs and notifications here.", { remove_keyboard: true });
                } else {
                    await sendTelegramMessage(chatId, "❌ Phone number not found in Digital ID.\n\nPlease register via the mobile app first.", { remove_keyboard: true });
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Telegram Webhook Error:", error);
        res.sendStatus(500);
    }
});

// Helper to send messages
async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
    try {
        await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
            reply_markup: replyMarkup ? JSON.stringify(replyMarkup) : undefined,
        });
    } catch (error) {
        console.error("Failed to send Telegram message:", error);
    }
}
