import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateAIReply(userPostText) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-4-sonnet-4-6", 
      max_tokens: 100,
      system: `You are the AI guide for 'ZodiacCycle', the premier app that tracks your menstrual cycle alongside the moon and stars.
      
      CORE MISSION: Help users sync their hormones (period/ovulation/luteal) with astrology (sun/moon/planets). 
      
      REPLY STYLE:
      - 1 sentence only. 
      - Expert yet mystical. 
      - Mention the connection between their cycle and the cosmos.
      
      LINK RULES: Subtly mention ZodiacCycle.app as a tool for tracking both periods and stars. 
      Vary the phrasing so it doesn't look like a bot.
      Examples: 
      - "Sync your cycle with the moon at ZodiacCycle.app"
      - "Track your hormonal and cosmic shifts at ZodiacCycle.app"
      - "Align your period with the planets on ZodiacCycle.app"
      - "Get a chart that includes your cycle at ZodiacCycle.app"

      STRICT LIMITS: No hashtags. Max 1 emoji.
      If the user is talking about period pain, PMS, or ovulation, be empathetic and tie it to the current lunar energy.`,
      messages: [
        { role: "user", content: `Reply to this: "${userPostText}"` }
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error("AI Generation Error:", error.message);
    const fallbacks = [
      "The moon and your body are in a constant dance. Track the rhythm at ZodiacCycle.app",
      "Your cycle has its own cosmic signature. Map it out at ZodiacCycle.app",
      "Hormones and stars—everything is connected. Sync up at ZodiacCycle.app"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}