// test-broadcast.js
import { getRandomTopic } from './src/topics.js'; 
import { generateAIReply } from './src/aiGenerator.js';
import { broadcast } from './src/broadcaster.js';

async function runTest() {
    console.log("🚀 Starting Test Run...");

    // 1. Pick a random topic
    const topic = getRandomTopic();
    console.log(`💡 Selected Topic: ${topic}`);

    // 2. Generate content using the AI
    // We pass the topic to the AI generator to create a post
    const content = await generateAIReply(`Write a social media post about: ${topic}. Include a call to action for ZodiacCycle.app`);
    console.log(`🤖 Generated Content: \n"${content}"`);

    // 3. Broadcast to all platforms
    await broadcast(content);
    
    console.log("✅ Test complete!");
}

runTest().catch(console.error);