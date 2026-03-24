import { rwClient } from './xClient.js';
import { generateAIReply } from './aiGenerator.js'; // Use the new AI logic
import dotenv from 'dotenv';
dotenv.config();

const SEARCH_QUERIES = [
  'period cramps -is:retweet lang:en',
  'menstrual cycle mood -is:retweet lang:en',
  'PMS symptoms -is:retweet lang:en',
  'moon sign astrology -is:retweet lang:en',
  'mercury retrograde -is:retweet lang:en',
  'cycle syncing -is:retweet lang:en',
  'luteal phase -is:retweet lang:en',
  'ovulation energy -is:retweet lang:en',
  'astrology and periods -is:retweet lang:en',
  'hormones mood -is:retweet lang:en',
];

const repliedIds = new Set();
let dailyReplyCount = 0;
let lastResetDate = new Date().toDateString();
const MAX_REPLIES_PER_DAY = 20;
const MAX_RETWEETS_PER_DAY = 5;
let dailyRetweetCount = 0;

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
    console.log('⏸️ Daily reply limit reached, skipping X engagement');
    return;
  }

  const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
  console.log(`🔍 X Search: ${query}`);

  try {
    const results = await rwClient.v2.search(query, {
      max_results: 10,
      'tweet.fields': ['author_id', 'public_metrics', 'text'],
      expansions: ['author_id'],
      'user.fields': ['public_metrics', 'username'],
    });

    if (!results.data || !results.data.data) {
      console.log('No tweets found for this query');
      return;
    }

    const tweets = results.data.data;
    const users = results.includes?.users || [];

    for (const tweet of tweets) {
      if (dailyReplyCount >= MAX_REPLIES_PER_DAY) break;
      if (repliedIds.has(tweet.id)) continue;

      const author = users.find((u) => u.id === tweet.author_id);
      if (!author) continue;

      const followerCount = author.public_metrics?.followers_count || 0;

      // Filter out low-follower accounts to avoid bot-to-bot loops
      if (followerCount < 10) {
        console.log(`⏭️ Skipping @${author.username} (Low followers)`);
        continue;
      }

      try {
        // 1. Generate unique AI reply
        console.log(`🤖 Generating AI reply for @${author.username}...`);
        const aiReply = await generateAIReply(tweet.text);
        
        // 2. Add the @username at the start (Required for X replies)
        const finalReply = `@${author.username} ${aiReply}`;

        // 3. Post the reply
        await rwClient.v2.reply(finalReply, tweet.id);
        
        repliedIds.add(tweet.id);
        dailyReplyCount++;
        console.log(`✅ X Reply Sent: ${finalReply}`);

        // 4. Handle Retweets
        const likeCount = tweet.public_metrics?.like_count || 0;
        if (dailyRetweetCount < MAX_RETWEETS_PER_DAY && likeCount >= 3) {
          const myId = (await rwClient.v2.me()).data.id;
          await rwClient.v2.retweet(myId, tweet.id);
          dailyRetweetCount++;
          console.log(`🔁 Retweeted tweet ${tweet.id}`);
        }

        // 5. Wait 60 seconds (X is stricter than Bsky/Mastodon)
        await new Promise((resolve) => setTimeout(resolve, 60000));
      } catch (engageError) {
        console.error(`❌ X Engagement Error:`, engageError.message);
      }
    }
  } catch (searchError) {
    console.error('❌ X Search error:', searchError.message);
  }
}