
import axios from "axios";
import { getSystemSettings } from "../db";

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
