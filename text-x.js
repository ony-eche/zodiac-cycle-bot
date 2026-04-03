import { rwClient } from './src/xClient.js';

async function testPost() {
  // src/replyEngine.js update
try {
  console.log(`🤖 Consulting Claude 4.6 for @${author.username}...`);
  const aiReply = await generateAIReply(tweet.text);
  
  // Ensure we don't send an empty reply if the AI is still "Thinking"
  if (!aiReply || aiReply.length < 5) {
    console.log("⚠️ AI returned empty response, skipping.");
    continue;
  }

  const finalReply = `@${author.username} ${aiReply}`;

  // Post via V2 Reply Object
  await rwClient.v2.tweet(finalReply, { 
    reply: { in_reply_to_tweet_id: tweet.id } 
  });
  
  console.log(`✨ Successfully replied to: ${tweet.id}`);
} catch (e) {
  console.error("❌ X Posting Error:", e.message);
}
testPost();