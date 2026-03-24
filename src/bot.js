import cron from 'node-cron';
import { rwClient } from './xClient.js';
import { postToBluesky } from './bskyClient.js';
import { postToMastodon } from './mastodonClient.js';
import { generateScheduledTweet } from './generateTweet.js';
import { searchAndEngage } from './replyEngine.js'; // X logic
import { getRandomTopic } from './topics.js';
import { postToThreads } from './threadsClient.js';
import { engageBluesky } from './bskyEngage.js';
import { engageMastodon } from './mastodonEngage.js';
import fs from 'fs';
const LOCK_FILE = './posting.lock';

async function runBot() {
    // 1. Check if a post is already in progress
    if (fs.existsSync(LOCK_FILE)) {
        console.log("⚠️ Post already in progress. Skipping duplicate execution.");
        return;
    }

    // 2. Create the lock file
    fs.writeFileSync(LOCK_FILE, 'processing');

    try {
        await postScheduledTweet(); // Your existing function
    } finally {
        // 3. Remove the lock file when finished (even if it crashes)
        fs.unlinkSync(LOCK_FILE);
    }
} 

const ensureClickable = (text) => {
  // Finds "zodiaccycle.app" and turns it into "https://zodiaccycle.app"
  return text.replace(/(?<!https?:\/\/)(zodiaccycle\.app)/gi, 'https://$1');
};
const rawContent = "Check your horoscope for today at zodiaccycle.app";
const finalContent = ensureClickable(rawContent);

// Now send 'finalContent' to all platforms

const formatLink = (url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

// This handles ALL platforms in one go every 15 mins
async function runGlobalEngagement() {
  console.log("🔍 Scanning for engagement opportunities on X, Bluesky, and Mastodon...");
  await Promise.allSettled([
    searchAndEngage(), // Your X function
    engageBluesky(),   // Your Bsky function
    engageMastodon()   // Your Mastodon function
  ]);
}

async function postScheduledTweet() {
  try {
    const topic = getRandomTopic();
    const baseContent = await generateScheduledTweet(topic);
    
    // Use your helper to ensure the link is clickable
    const website = formatLink("zodiaccycle.app"); 
    const finalContent = `${baseContent}\n\nRead more: ${website}`;
    
    console.log(`🚀 Broadcasting to all platforms...`);
    
    const platforms = ['X', 'Bluesky', 'Mastodon', 'Threads'];
    const results = await Promise.allSettled([
      rwClient.v2.tweet(finalContent),
      postToBluesky(finalContent),
      postToMastodon(finalContent),
      postToThreads(finalContent)
    ]);

    results.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        console.log(`✅ ${platforms[i]} post successful.`);
      } else {
        console.error(`❌ ${platforms[i]} failed:`, res.reason?.message || res.reason);
      }
    });

  } catch (error) {
    console.error('❌ General Error in postScheduledTweet:', error.message);
    throw error; // Re-throw so the 'finally' block in runBot knows we're done
  }
}
// At the very top of your cron section
const tasks = [];

const scheduleJob = (time, fn) => {
  const task = cron.schedule(time, fn);
  tasks.push(task);
  return task;
};

// 1. CLEAR OLD TASKS (Prevents double-triggering on restart)
tasks.forEach(task => task.stop());

// 2. Schedule using the helper
scheduleJob('0 8 * * *', runBot);
scheduleJob('0 13 * * *', runBot);
scheduleJob('0 19 * * *', runBot);
scheduleJob('*/15 * * * *', runGlobalEngagement);
// --- Cron Schedules ---
// CHANGE THESE: Call runBot instead of postScheduledTweet
cron.schedule('0 8 * * *', runBot);
cron.schedule('0 13 * * *', runBot);
cron.schedule('0 19 * * *', runBot);

// Combined engagement job (Runs every 15 mins)
cron.schedule('*/15 * * * *', runGlobalEngagement);

console.log('🌙 ZodiacCycle multi-platform bot is live!');

// If you want to test on startup, use runBot() so the lock file is created
// runBot();