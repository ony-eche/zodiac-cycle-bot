import { BskyAgent, RichText } from '@atproto/api';
import dotenv from 'dotenv';
dotenv.config();

// Persistent memory for the current process run
const bskyRepliedIds = new Set();

export async function postToBluesky(text, replyData = null) {
    try {
        // 1. Session Memory Check
        if (replyData && bskyRepliedIds.has(replyData.root.uri)) {
            console.log(`⏭️ Already replied to ${replyData.root.uri} in this session. Skipping.`);
            return;
        }

        const agent = new BskyAgent({ service: 'https://bsky.social' });
        await agent.login({
            identifier: process.env.BLUESKY_HANDLE.trim(),
            password: process.env.BLUESKY_PASSWORD.trim(),
        });

        // 2. EXTRA SAFETY: Deep Thread Verification
        // If it's a reply, check the actual thread to see if we've ALREADY replied in a past run.
        if (replyData) {
            try {
                const thread = await agent.getPostThread({ uri: replyData.root.uri });
                const existingReplies = thread.data.thread.replies || [];
                const alreadyReplied = existingReplies.some(r => r.post?.author?.did === agent.session.did);
                
                if (alreadyReplied) {
                    console.log(`🚫 Deep Check: Already replied to this thread previously. Skipping.`);
                    bskyRepliedIds.add(replyData.root.uri);
                    return;
                }
            } catch (e) {
                console.warn("⚠️ Could not verify thread history, proceeding carefully.");
            }
        }

        // 3. Prepare RichText (Handles clickable @mentions and links)
        const rt = new RichText({ text: text });
        await rt.detectFacets(agent); 

        // 4. Character Limit Check (Bluesky hard-limit is 300)
        if (rt.graphemeLength > 300) {
            console.warn(`⚠️ Warning: Post too long (${rt.graphemeLength} chars). Truncating...`);
            // We truncate to 297 to leave room for "..."
            rt.text = rt.text.substring(0, 297) + "...";
        }

        // 5. Send the post
        const postPayload = {
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString(),
        };

        if (replyData) {
            postPayload.reply = replyData;
        }

        const response = await agent.post(postPayload);

        // 6. Record success
        if (replyData) {
            bskyRepliedIds.add(replyData.root.uri);
            console.log("✨ Successfully replied to Bluesky post!");
        } else {
            console.log("✅ Broadcasted standalone post to Bluesky!");
        }

        return response;

    } catch (error) {
        console.error("❌ Bluesky Client Error:", error.message);
        throw error; 
    }
}