import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateScheduledTweet(topic) {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are the voice behind ZodiacCycle, a friendly astrology and cycle tracking app at zodiaccycle.app.

Write a single tweet (max 280 characters including the URL) about this topic:
"${topic}"

Rules:
- Tone: casual, warm, and relatable — like a knowledgeable friend texting you
- Vary the tone: sometimes empathetic and supportive, sometimes fun and witty, sometimes educational
- Always end with or naturally include: zodiaccycle.app
- Use 1-2 relevant emojis max
- Use 1-2 hashtags max (e.g. #CycleTracking #Astrology #WomensHealth)
- DO NOT use quotes around the tweet
- DO NOT add any explanation, just the tweet text itself
- Make it feel authentic, not salesy`,
      },
    ],
  });

  return message.content[0].text.trim();
}

export async function generateReply(tweetText, authorName) {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are the voice behind ZodiacCycle, a friendly astrology and cycle tracking app at zodiaccycle.app.

Someone posted this tweet:
"${tweetText}"

Write a genuine, helpful reply (max 260 characters, leaving room for the URL).

Rules:
- Address what they said directly and meaningfully — don't be generic
- Vary tone based on content: empathetic if they're struggling, fun if it's lighthearted, educational if they're curious
- Naturally weave in how zodiaccycle.app could help them — don't force it
- Keep it conversational, like a reply from a knowledgeable friend
- Use 1 emoji max
- No hashtags in replies
- DO NOT start with "Hey!" or "Hi!" every time — vary your opening
- DO NOT add any explanation, just the reply text itself`,
      },
    ],
  });

  return message.content[0].text.trim();
}