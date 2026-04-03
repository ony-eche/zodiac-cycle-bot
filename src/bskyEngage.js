import Atproto from '@atproto/api';
const { BskyAgent } = Atproto;
import { generateAIReply } from './aiGenerator.js';
import { getRobustAstroQuery } from './astroConstants.js'; 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const bskyRepliedIds = new Set(); 

export async function engageBluesky() {
  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    await agent.login({ 
      identifier: process.env.BLUESKY_HANDLE, 
      password: process.env.BLUESKY_PASSWORD 
    });

    const query = getRobustAstroQuery(); 
    console.log(`🔍 Bluesky: Searching for "${query}"...`);
    
    const response = await agent.app.bsky.feed.searchPosts({ q: query, limit: 5 });
    
    if (!response.data.posts || response.data.posts.length === 0) {
      console.log(`📭 No recent posts found for "${query}"`);
      return;
    }

    for (const post of response.data.posts) {
      // --- 1. THE SELF-REPLY FIX ---
      // We check if the author's handle matches your bot's handle
      if (post.author.handle === process.env.BLUESKY_HANDLE || 
          post.author.handle === 'zodiaccycleapp.bsky.social') {
        console.log(`⏭️ Skipping @${post.author.handle} (That's me!)`);
        continue;
      }

      // 2. Session Memory Check
      if (bskyRepliedIds.has(post.uri)) {
        console.log(`⏭️ Skipping @${post.author.handle} (Already seen this session)`);
        continue;
      }

      // 3. Deep Thread Check
      try {
        const thread = await agent.getPostThread({ uri: post.uri });
        const replies = thread.data.thread.replies || [];
        const alreadyReplied = replies.some(r => r.post?.author?.did === agent.session.did);
        
        if (alreadyReplied) {
          console.log(`🚫 Already replied to @${post.author.handle} previously.`);
          bskyRepliedIds.add(post.uri); 
          continue;
        }
      } catch (threadErr) {
        console.warn("⚠️ Could not verify thread, skipping safety check.");
      }

      const userText = post.record?.text || "";

      // 4. Generate AI response
      console.log(`🤖 Consulting Claude for "${query}" post by @${post.author.handle}...`);
      const aiReply = await generateAIReply(userText);

      // 5. Formatting & Safety
      let finalReply = aiReply;
      if (finalReply.length > 290) {
        finalReply = finalReply.substring(0, 287) + "...";
      }

      // 6. Post the Reply
      await agent.post({
        text: finalReply,
        reply: {
          root: { uri: post.uri, cid: post.cid },
          parent: { uri: post.uri, cid: post.cid }
        }
      });

      bskyRepliedIds.add(post.uri);
      console.log(`✅ AI Replied to @${post.author.handle}`);

      await sleep(10000); 
    }
  } catch (error) {
    console.error("❌ Bluesky Engagement Error:", error.message);
  }
}