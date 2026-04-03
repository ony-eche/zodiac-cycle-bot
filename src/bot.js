import http from 'http'; 
import fs from 'fs';
import cron from 'node-cron';
import { rwClient } from './xClient.js';
// ... (your other imports)

// --- 2. ADD THIS DUMMY SERVER RIGHT HERE ---
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('ZodiacCycle Bot is Active 🚀');
  res.end();
}).listen(process.env.PORT || 3000); 
console.log("🌐 Dummy server started to keep Render happy.");
// --------------------------------------------

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
 * 1. BROADCAST ENGINE (Scheduled Posts)
 */
async function postScheduledTweet() {
    try {
        const topic = getRandomTopic();
        const baseContent = await generateScheduledTweet(topic);
        const finalContent = `${baseContent}\n\nSync your cycle: https://zodiaccycle.app`;
        
        console.log(`🚀 Broadcasting to all platforms...`);
        // Broadcasts are light on CPU, so Promise.all is fine here
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
 * 2. ENGAGEMENT ENGINE (The "Staggered" Fix)
 * We run these sequentially to prevent the CPU from spiking 
 * while waiting for multiple Claude 4.6 responses.
 */
async function runGlobalEngagement() {
    await withLock(ENGAGE_LOCK, async () => {
        console.log("🔍 Staggered Engagement Start...");
        
        console.log("-> Processing X...");
        await searchAndEngage();
        
        console.log("-> Processing Bluesky...");
        await engageBluesky();
        
        console.log("-> Processing Mastodon...");
        await engageMastodon();
        
        console.log("✅ All engagement cycles complete.");
    });
}

// --- CRON SCHEDULING ---

// Broadcast posts 3x a day
cron.schedule('0 8,13,19 * * *', () => {
    withLock(LOCK_FILE, postScheduledTweet);
});

// Engagement every 15 mins (staggered internally)
cron.schedule('*/15 * * * *', runGlobalEngagement);

// Initial start-up run
runGlobalEngagement();