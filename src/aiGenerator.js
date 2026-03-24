import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateAIReply(userPostText) {
  try {
    const response = await anthropic.messages.create({
     model: "claude-haiku-4.5", // Or "claude-4-5-haiku" in 2026
      max_tokens: 100,
      system: "You are a friendly, mysterious zodiac bot for 'ZodiacCycle'. Write a 1-sentence reply to the user's post. Be encouraging and subtly mention that they can find more at ZodiacCycle.app. Don't use hashtags or emojis in every single post.",
      messages: [
        { role: "user", content: `Reply to this social media post: "${userPostText}"` }
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "The stars are aligning! Check out your full reading at ZodiacCycle.app ✨"; // Fallback
  }
}