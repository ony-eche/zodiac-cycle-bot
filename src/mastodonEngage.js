import Mastodon from 'mastodon-api';
import { generateAIReply } from './aiGenerator.js';
import { getRobustAstroQuery } from './astroConstants.js'; // THE SYNC

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const mastodonRepliedIds = new Set();

export async function engageMastodon() {
  try {
    const M = new Mastodon({
      access_token: process.env.MASTODON_ACCESS_TOKEN,
      api_url: 'https://mastodon.social/api/v1/' 
    });

    // --- THE DYNAMIC UPDATE ---
    // Instead of a static list, we get a fresh query from the engine
    const query = getRobustAstroQuery();
    console.log(`🔍 Mastodon: Searching for "${query}"...`);
    
    // Perform V2 search
    const search = await M.get('v2/search', { q: query, type: 'statuses', limit: 5 });

    // Access search.data.statuses directly with a fallback to avoid "not iterable" error
    const statuses = search.data?.statuses || [];

    if (statuses.length === 0) {
      console.log(`📭 No new posts found for "${query}" on this instance.`);
      return;
    }

    for (const status of statuses) {
      // 1. Session Check (Prevents double-replies in the same run)
      if (mastodonRepliedIds.has(status.id)) continue;

      // 2. Account Verification (Checks thread history to prevent spamming)
      try {
        const context = await M.get(`statuses/${status.id}/context`);
        const alreadyReplied = (context.data?.descendants || []).some(
          desc => desc.account.username === process.env.MASTODON_USERNAME
        );

        if (alreadyReplied) {
          console.log(`🚫 Already replied to @${status.account.username} previously. Skipping.`);
          mastodonRepliedIds.add(status.id);
          continue;
        }
      } catch (contextErr) {
        console.warn("⚠️ Could not verify context, proceeding with caution.");
      }

      // 3. Clean Text and Generate Reply
      // Mastodon posts arrive as HTML, so we strip tags before sending to Claude
      const cleanText = status.content.replace(/<[^>]*>?/gm, ''); 
      console.log(`🤖 Generating AI reply for: "${cleanText.substring(0, 30)}..."`);
      
      const aiReply = await generateAIReply(cleanText);
      if (!aiReply) continue;

      // 4. Character Limit Safety (Mastodon is usually 500, we stay safe at 450)
      let finalReply = aiReply;
      if (finalReply.length > 450) {
        finalReply = finalReply.substring(0, 447) + "...";
      }

      // 5. Post the reply
      await M.post('statuses', {
        status: `@${status.account.acct} ${finalReply}`,
        in_reply_to_id: status.id,
        visibility: 'public' // Ensures visibility on the public timeline
      });

      mastodonRepliedIds.add(status.id);
      console.log(`✅ AI Replied to @${status.account.username}`);

      // 6. Good Citizen Sleep (10s is standard for Mastodon etiquette)
      await sleep(10000);
    }
  } catch (error) {
    console.error("❌ Mastodon Engagement Error:", error.message);
  }
}