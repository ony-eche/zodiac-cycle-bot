import Atproto from '@atproto/api';
const { BskyAgent } = Atproto;
import { generateAIReply } from './aiGenerator.js';
// Make sure to export this from your constants file or define it here
import { getRobustAstroQuery } from './astroConstants.js'; 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Persists while the process is active
const bskyRepliedIds = new Set(); 

export async function engageBluesky() {
  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    await agent.login({ 
      identifier: process.env.BLUESKY_HANDLE, 
      password: process.env.BLUESKY_PASSWORD 
    });

    // --- THE DYNAMIC UPDATE ---
    const query = getRobustAstroQuery(); 
    console.log(`🔍 Bluesky: Searching for "${query}"...`);
    
    // Increased limit slightly since we have more niche queries now
    const response = await agent.app.bsky.feed.searchPosts({ q: query, limit: 5 });
    
    if (!response.data.posts || response.data.posts.length === 0) {
      console.log(`📭 No recent posts found for "${query}"`);
      return;
    }

    for (const post of response.data.posts) {
      // 1. Session Memory Check
      if (bskyRepliedIds.has(post.uri)) {
        console.log(`⏭️ Skipping @${post.author.handle} (Already seen this session)`);
        continue;
      }

      // 2. Deep Thread Check (Prevents double-replies across Cron restarts)
      try {
        const thread = await agent.getPostThread({ uri: post.uri });
        const replies = thread.data.thread.replies || [];
        
        // Ensure we haven't replied using our DID (Decentralized ID)
        const alreadyReplied = replies.some(r => r.post?.author?.did === agent.session.did);
        
        if (alreadyReplied) {
          console.log(`🚫 Already replied to @${post.author.handle} in a previous run.`);
          bskyRepliedIds.add(post.uri); 
          continue;
        }
      } catch (threadErr) {
        console.warn("⚠️ Could not verify thread, skipping safety check.");
      }

      const userText = post.record?.text || "";

      // 3. Generate AI response based on the specific query found
      console.log(`🤖 Consulting Claude for "${query}" post by @${post.author.handle}...`);
      const aiReply = await generateAIReply(userText);

      // 4. Formatting & Safety
      let finalReply = aiReply;
      if (finalReply.length > 290) {
        finalReply = finalReply.substring(0, 287) + "...";
      }

      // 5. Post the Reply
      await agent.post({
        text: finalReply,
        reply: {
          root: { uri: post.uri, cid: post.cid },
          parent: { uri: post.uri, cid: post.cid }
        }
      });

      // 6. Record success
      bskyRepliedIds.add(post.uri);
      console.log(`✅ AI Replied to @${post.author.handle}`);

      // 10s wait to keep the 2026 Bluesky "Firehose" happy
      await sleep(10000); 
    }
  } catch (error) {
    console.error("❌ Bluesky Engagement Error:", error.message);
  }
}