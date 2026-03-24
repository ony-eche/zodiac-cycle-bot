import { createRestAPIClient } from 'masto';
import dotenv from 'dotenv';
dotenv.config();

export async function postToMastodon(text) {
    try {
        // Ensure the URL and Token are present
        const masto = createRestAPIClient({
            url: process.env.MASTO_INSTANCE_URL.trim(), // e.g., https://mastodon.social
            accessToken: process.env.MASTO_ACCESS_TOKEN.trim(),
        });

        // Mastodon has a 500-character limit (standard)
        if (text.length > 500) {
            console.warn("⚠️ Mastodon post exceeds 500 characters. It might be truncated by the server.");
        }

        await masto.v1.statuses.create({ 
            status: text,
            visibility: 'public' // Ensures the post is visible to everyone
        });

        console.log("✅ Posted to Mastodon!");
    } catch (error) {
        console.error("❌ Mastodon Error:", error.message);
        // Throwing the error allows your broadcast.js 'Promise.allSettled' to catch the failure
        throw error;
    }
}