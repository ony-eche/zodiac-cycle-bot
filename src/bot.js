import http from 'http'; 
import fs from 'fs';
import cron from 'node-cron';

// 1. ALL NECESSARY IMPORTS (Make sure these paths are correct)
import { rwClient } from './xClient.js';
import { postToBluesky } from './bskyClient.js';
import { postToMastodon } from './mastodonClient.js';
import { postToThreads } from './threadsClient.js';
import { generateScheduledTweet } from './generateTweet.js';
import { searchAndEngage } from './replyEngine.js'; 
import { engageBluesky } from './bskyEngage.js';
import { engageMastodon } from './mastodonEngage.js';
import { getRandomTopic } from './topics.js';

// --- 2. DUMMY SERVER (Keeps Render alive) ---
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('ZodiacCycle Bot is Active 🚀');
  res.end();
}).listen(process.env.PORT || 3000); 

console.log("🌐 Dummy server started to keep Render happy.");

const LOCK_FILE = './posting.lock';
const ENGAGE_LOCK = './engage.lock';

// Helper to prevent "Zombie" processes
const withLock = async (lockPath, taskFn) => {
    if (fs.existsSync(lockPath)) {
        console.log(`⚠️ Task at ${lockPath} already in progress. Skipping.`);
        return;
    }
    fs.writeFileSync(lockPath, 'processing');
    try {
        await taskFn();
    } finally {
        if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
    }
};

/**
 * BROADCAST ENGINE (Scheduled Posts)
 */
async function postScheduledTweet() {
    try {
        const topic = getRandomTopic();
        const baseContent = await generateScheduledTweet(topic);
        const finalContent = `${baseContent}\n\nSync your cycle: https://zodiaccycle.app`;
        
        console.log(`🚀 Broadcasting to all platforms...`);
        await Promise.allSettled([
            rwClient.v2.tweet(finalContent),
            postToBluesky(finalContent),
            postToMastodon(finalContent),
            postToThreads(finalContent)
        ]);
    } catch (error) {
        console.error('❌ Broadcast Error:', error.message);
    }
}

/**
 * ENGAGEMENT ENGINE (Staggered to save CPU)
 */
async function runGlobalEngagement() {
    await withLock(ENGAGE_LOCK, async () => {
        console.log("🔍 Staggered Engagement Start...");
        
        try {
            console.log("-> Processing X...");
            await searchAndEngage();
        } catch (e) { console.error("❌ X Logic Failed:", e.message); }
        
        try {
            console.log("-> Processing Bluesky...");
            await engageBluesky();
        } catch (e) { console.error("❌ Bluesky Logic Failed:", e.message); }
        
        try {
            console.log("-> Processing Mastodon...");
            await engageMastodon();
        } catch (e) { console.error("❌ Mastodon Logic Failed:", e.message); }
        
        console.log("✅ All engagement cycles complete.");
    });
}

// --- CRON SCHEDULING ---

// Broadcast posts at 8 AM, 1 PM, and 7 PM
cron.schedule('0 8,13,19 * * *', () => {
    withLock(LOCK_FILE, postScheduledTweet);
});

// Engagement every 15 mins
cron.schedule('*/15 * * * *', runGlobalEngagement);

// Run once immediately on startup
runGlobalEngagement();