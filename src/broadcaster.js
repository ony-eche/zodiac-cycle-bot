import { rwClient } from './xClient.js';
import { postToBluesky } from './bskyClient.js';
import { postToMastodon } from './mastodonClient.js';
import { postToThreads } from './threadsClient.js';

/**
 * Sends content to all 4 platforms safely.
 * Truncates for X to prevent 403 errors and uses allSettled 
 * to ensure one failure doesn't crash the cron.
 */
export async function broadcast(content) {
    console.log("📢 Broadcasting to all platforms...");

    // 1. X-specific truncation (X is the strictest at 280 chars)
    const xContent = content.length > 280 ? content.substring(0, 277) + "..." : content;

    const platforms = ['X', 'Bluesky', 'Mastodon', 'Threads'];

    // 2. Promise.allSettled is the "Magic Shield" 
    // It prevents an X error from stopping Bluesky/Mastodon.
    const results = await Promise.allSettled([
        rwClient.v2.tweet(xContent), // Uses truncated version
        postToBluesky(content),
        postToMastodon(content),
        postToThreads(content)
    ]);

    // 3. Log results without crashing
    results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
            console.log(`✅ ${platforms[i]}: Post successful.`);
        } else {
            // This captures the error instead of letting it crash the bot
            const errorMsg = res.reason?.data?.detail || res.reason?.message || res.reason;
            console.error(`❌ ${platforms[i]} failed:`, errorMsg);
        }
    });
}