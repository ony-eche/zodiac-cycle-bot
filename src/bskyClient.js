import { BskyAgent, RichText } from '@atproto/api';
import dotenv from 'dotenv';
dotenv.config();

export async function postToBluesky(text) {
    try {
        const agent = new BskyAgent({ service: 'https://bsky.social' });
        await agent.login({
            identifier: process.env.BSKY_IDENTIFIER.trim(),
            password: process.env.BSKY_APP_PASSWORD.trim(),
        });

        // 1. Prepare RichText for clickable links & mentions
        const rt = new RichText({ text: text });
        
        // 2. Automatically detect links (facets)
        await rt.detectFacets(agent); 

        // 3. Safety Check: Bluesky has a 300-character limit
        if (rt.graphemeLength > 300) {
            console.warn(`⚠️ Warning: Bluesky post is too long (${rt.graphemeLength} chars). Truncating...`);
        }

        // 4. Send the post
        await agent.post({
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString(),
        });

        console.log("✅ Posted to Bluesky with clickable facets!");
    } catch (error) {
        console.error("❌ Bluesky Error:", error.message);
        // Throwing the error helps the 'broadcast' function know it failed
        throw error; 
    }
}