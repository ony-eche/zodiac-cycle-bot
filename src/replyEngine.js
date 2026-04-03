import { rwClient } from './xClient.js';
import { generateAIReply } from './aiGenerator.js';
import { getRobustAstroQuery } from './astroConstants.js'; // Import the generator
import dotenv from 'dotenv';
dotenv.config();

const WARMUP_MODE = true; 

const repliedIds = new Set();
let dailyReplyCount = 0;
let dailyRetweetCount = 0;
let lastResetDate = new Date().toDateString();

const MAX_REPLIES_PER_DAY = 20;
const MAX_RETWEETS_PER_DAY = 5;

function resetDailyCountersIfNeeded() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyReplyCount = 0;
    dailyRetweetCount = 0;
    lastResetDate = today;
    console.log('🔄 Daily counters reset');
  }
}

export async function searchAndEngage() {
  resetDailyCountersIfNeeded();

  if (dailyReplyCount >= MAX_REPLIES_PER_DAY) {
    console.log('⏸️ Daily action limit reached, skipping X engagement');
    return;
  }

  // --- THE DYNAMIC UPDATE ---
  // Get a unique query (e.g., "Mars in Scorpio" or "moon sign ?")
  const rawQuery = getRobustAstroQuery();
  
  // Append X-specific filters to ensure high quality and protect PPU credits
  const query = `${rawQuery} -is:retweet lang:en`;
  
  console.log(`🔍 X Search: ${query} ${WARMUP_MODE ? '(WARMUP MODE ACTIVE)' : ''}`);

  try {
    const results = await rwClient.v2.search(query, {
      max_results: 10,
      'tweet.fields': ['author_id', 'public_metrics', 'text'],
      expansions: ['author_id'],
      'user.fields': ['public_metrics', 'username'],
    });

    if (WARMUP_MODE) {
      console.log("🛡️ Warmup Mode: Sending trust-building post.");
      const phrases = [
        "Aligning with the cosmic cycle today. ✨",
        "The moon influences more than just the tides. 🌙",
        "Every phase of your cycle is a different kind of power. 🌸",
        "Listening to the stars and my body. #ZodiacCycle"
      ];
      const warmUpPost = phrases[Math.floor(Math.random() * phrases.length)];
      const response = await rwClient.v2.tweet(warmUpPost);
      if (response.data) {
          console.log(`✅ Trust Post Sent: ${response.data.id}`);
          dailyReplyCount++; 
      }
      return; 
    }

    if (!results.data || !results.data.data) {
      console.log(`No tweets found for "${query}"`);
      return;
    }

    const tweets = results.data.data;
    const users = results.includes?.users || [];

    for (const tweet of tweets) {
      if (dailyReplyCount >= MAX_REPLIES_PER_DAY) break;
      if (repliedIds.has(tweet.id)) continue;

      const author = users.find((u) => u.id === tweet.author_id);
      if (!author || (author.public_metrics?.followers_count || 0) < 10) continue;

      try {
        // --- PPU PROTECTION: Check if thread is already saturated ---
        const tweetDetail = await rwClient.v2.singleTweet(tweet.id, {
            'tweet.fields': ['public_metrics']
        });
        
        if (tweetDetail.data.public_metrics.reply_count > 5) {
            console.log(`⏭️ Skipping @${author.username} (Thread too crowded)`);
            continue;
        }

        console.log(`🤖 Consulting Claude for @${author.username}...`);
        const aiReply = await generateAIReply(tweet.text);
        if (!aiReply || aiReply.length < 5) continue;

        const finalReply = `@${author.username} ${aiReply}`;

        // --- ANTI-GHOSTING POSTING ---
        const response = await rwClient.v2.tweet({
          text: finalReply,
          reply: { in_reply_to_tweet_id: tweet.id },
          reply_settings: 'following' // Crucial for 2026 delivery
        });

        if (response.data && response.data.id) {
          repliedIds.add(tweet.id);
          dailyReplyCount++;
          console.log(`✨ LIVE! Tweet ID: ${response.data.id}`);

          if (dailyRetweetCount < MAX_RETWEETS_PER_DAY && (tweet.public_metrics?.like_count || 0) >= 3) {
            await rwClient.v2.retweet(process.env.X_USER_ID, tweet.id);
            dailyRetweetCount++;
          }

          // Cool-down to maintain "Human" rhythm
          await new Promise((resolve) => setTimeout(resolve, 60000));
        }

      } catch (e) {
        const errorDetail = e.data?.detail || e.message;
        console.error("❌ X PPU Error:", errorDetail);
        
        if (e.code === 403 || errorDetail.includes("permissions")) {
          console.log("🛑 Stopping loop: Permission gate detected.");
          break; 
        }
      }
    }
  } catch (searchError) {
    console.error('❌ X Search error:', searchError.message);
  }
}