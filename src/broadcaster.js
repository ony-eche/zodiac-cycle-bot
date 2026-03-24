import { rwClient } from './xClient.js';
import { postToBluesky } from './bskyClient.js';
import { postToMastodon } from './mastodonClient.js';
import { postToThreads } from './threadsClient.js';

/**
 * Sends a single piece of content to all 4 connected platforms.
 * Uses Promise.allSettled so that a failure on one (like X rate limits)
 * doesn't stop the others from posting.
 */
export async function broadcast(content) {
    console.log("📢 Broadcasting to all platforms...");

    const platforms = ['X', 'Bluesky', 'Mastodon', 'Threads'];

    const results = await Promise.allSettled([
        rwClient.v2.tweet(content), // X
        postToBluesky(content),     // Bluesky
        postToMastodon(content),    // Mastodon
        postToThreads(content)      // Threads
    ]);

    results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
            console.log(`✅ ${platforms[i]}: Post successful.`);
        } else {
            // Logs why it failed (e.g., "Invalid Token" or "Rate Limit")
            console.error(`❌ ${platforms[i]} failed:`, res.reason?.message || res.reason);
        }
    });
}