import Mastodon from 'mastodon-api';
import { generateAIReply } from './aiGenerator.js'; // Import your AI logic

// Simple helper to pause between replies
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function engageMastodon() {
  try {
    const M = new Mastodon({
      access_token: process.env.MASTODON_ACCESS_TOKEN,
      api_url: 'https://mastodon.social/api/v1/' 
    });

    console.log("🔍 Mastodon: Searching for #zodiac posts...");
    
    // Search for the hashtag #zodiac
    // We use v2 search for better results in 2026
    const search = await M.get('v2/search', { q: '#zodiac', type: 'statuses', limit: 2 });

    for (const status of search.data.statuses) {
      // 1. Clean the HTML out of Mastodon posts (they come as HTML strings)
      const cleanText = status.content.replace(/<[^>]*>?/gm, ''); 

      // 2. Generate a unique AI reply
      console.log(`🤖 Generating Mastodon AI reply for: "${cleanText.substring(0, 30)}..."`);
      const aiReply = await generateAIReply(cleanText);

      // 3. Post the reply
      // We mention the user handle at the start so they get a notification
      await M.post('statuses', {
        status: `@${status.account.acct} ${aiReply}`,
        in_reply_to_id: status.id
      });

      console.log(`✅ AI Replied to Mastodon user: ${status.account.username}`);

      // 4. Wait 5 seconds to avoid rate limits
      await sleep(5000);
    }
  } catch (error) {
    console.error("❌ Mastodon Engagement Error:", error.message);
  }
}