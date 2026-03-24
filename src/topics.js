// Rotates through varied topic categories for scheduled tweets
export const tweetTopics = [
  // Cycle phases
  "The energy difference between follicular and luteal phase and why women feel so different week to week",
  "Why the luteal phase makes you want to cancel plans and stay in — and why that's completely valid",
  "Ovulation week and why you suddenly feel unstoppable and social",
  "Menstruation phase as a reset — rest isn't laziness, it's biology",

  // Astrology x cycle
  "How Mercury retrograde can amplify PMS symptoms and emotional sensitivity",
  "Why full moons hit harder during your luteal phase",
  "The connection between your moon sign and how you experience your cycle emotionally",
  "New moon intentions and how syncing them with your follicular phase supercharges them",
  "How Venus transits affect libido and how your cycle phase amplifies or dampens that",
  "Your rising sign and how it shapes the way you cope with period pain",

  // Symptoms & wellness
  "Why cycle tracking is the most underrated wellness tool for women",
  "The link between stress, cortisol, and irregular periods — and what to do about it",
  "Why your food cravings change every week of your cycle (it's not lack of willpower)",
  "Sleep and your cycle — why you sleep worse in the week before your period",
  "Why some weeks you're a social butterfly and others you need total silence — cycle science explains it",

  // Add these to your tweetTopics array if you want more comments:
  "Ask your followers: What's the one cycle phase they find the hardest to navigate?",
  "Debunking the myth that 'PMS is just in your head' — it's hormonal chemistry.",
  "Question for the community: Do you notice your moon sign traits come out more during ovulation or menstruation?",
  
  // App promo angle
  "How knowing your cycle phase in advance can change how you plan your week",
  "What if you could predict your best days for creativity, rest, and social energy every month?",
  "Combining astrology and cycle tracking for a fuller picture of your emotional landscape",
];

export function getRandomTopic() {
  return tweetTopics[Math.floor(Math.random() * tweetTopics.length)];
}