// src/astroConstants.js

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
];

const BASE_QUERIES = [
  // --- REAL TALK (Common Language) ---
  'my period',
  'my cycle',
  'time of the month',
  'menstrual cycle',
  'period cramps',
  'pmsing',
  'late period',
  'ovulating',
  'hormonal acne',

  // --- HIGH INTENT (Questions) ---
  'moon sign ?', 
  'mercury retrograde symptoms ?',
  'what is my rising sign ?',
  'cycle syncing tips ?',
  'how to track luteal phase ?',

  // --- CORE TAGS ---
  '#astrology', '#zodiac', '#horoscope', '#birthchart', '#zodiaccycles',

  // --- WELLNESS & BIO-HACKING ---
  'luteal phase mood',
  'follicular phase energy',
  'hormone balancing tips',
  'ovulation symptoms',
  'PMS relief',
  'ascendant sign',
  'rising sign',
  'saturn return'
];

/**
 * Generates a fresh search query.
 * 25% chance: Planet in a Sign (The "Expert" crowd)
 * 15% chance: Sign + Horoscope (The "Casual" crowd)
 * 60% chance: Real talk & Wellness (The "Core" audience)
 */
export function getRobustAstroQuery() {
  const roll = Math.random();

  // Planet + Sign (e.g., "Venus in Leo")
  if (roll < 0.25) {
    const planet = PLANETS[Math.floor(Math.random() * PLANETS.length)];
    const sign = SIGNS[Math.floor(Math.random() * SIGNS.length)];
    return `${planet} in ${sign}`;
  } 
  
  // Sign + Horoscope (e.g., "Scorpio horoscope")
  if (roll < 0.40) {
    const sign = SIGNS[Math.floor(Math.random() * SIGNS.length)];
    return `${sign} horoscope`;
  }

  // Real Talk & Wellness (e.g., "time of the month")
  return BASE_QUERIES[Math.floor(Math.random() * BASE_QUERIES.length)];
}