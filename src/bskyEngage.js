import Atproto from '@atproto/api';
const { BskyAgent } = Atproto;
import { generateAIReply } from './aiGenerator.js'; // Import your AI logic

// Simple helper to pause between replies (prevents bot flags)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function engageBluesky() {
  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    await agent.login({ 
      identifier: process.env.BLUESKY_HANDLE, 
      password: process.env.BLUESKY_PASSWORD 
    });

    console.log("🔍 Bluesky: Searching for 'horoscope' posts...");
    const response = await agent.app.bsky.feed.searchPosts({ q: 'horoscope', limit: 3 });
    
    for (const post of response.data.posts) {
      // 1. Get the text of the user's post
      const userText = post.record?.text || "";

      // 2. Call Anthropic to get a custom, unique reply
      console.log(`🤖 Generating AI reply for: "${userText.substring(0, 30)}..."`);
      const aiReply = await generateAIReply(userText);

      // 3. Post the reply
      await agent.post({
        text: aiReply,
        reply: {
          root: { uri: post.uri, cid: post.cid },
          parent: { uri: post.uri, cid: post.cid }
        }
      });

      console.log(`✅ AI Replied to ${post.author.handle}: ${aiReply}`);

      // 4. Wait 5 seconds before the next one to stay "human-like"
      await sleep(5000); 
    }
  } catch (error) {
    console.error("❌ Bluesky Engagement Error:", error.message);
  }
}