import { CANONICAL_TAROT_LIST } from './tarotCardDatabase';

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const HOOK_PHRASES = [
  "If you’ve been second-guessing yourself lately, today is about turning the lights on—gently, but honestly.",
  "There's the story you're telling… and there's what's sitting between it.",
  "If everything feels stuck and just out of reach—clarity or understanding—this is where we name it.",
  "Some answers don't show up in the obvious. They show up in the space between.",
  "Let's bring clean light to what's been confusing you—no drama, just clarity.",
  "We're shining light on the part you keep trying to explain away.",
  "This is clarity work. We're naming what's real, and letting the rest fall off.",
  "You don't need a perfect answer—you need your next right step.",
  "Let's turn confusion into direction. One clear step at a time.",
  "This is about movement with intention—what to keep, what to cut, and where you go next.",
  "We're finding the road through the fog—practical, grounded, and doable.",
  "We're keeping it honest today: what's true, what's not, and what you do about it.",
  "No fluff—just the pattern, the lesson, and the move.",
  "If it's been heavy, we're not running from it. We're making sense of it and moving smarter.",
  "Let's stop negotiating with what drains you. Clarity first—then direction.",
  "If you're here for you, stay. If you're here for someone else, stay.",
  "Take what's yours, leave what isn't. Either way, clarity wins.",
  "This can speak to you—or to what you're dealing with. Same truth, different angle.",
  "If you're watching for a person, listen for the pattern—not the fantasy.",
  "Between confusion and clarity, there's a threshold. You're standing at it.",
  "What you're about to hear might shift how you see this situation.",
  "Some truths are sitting underneath the surface. Let's bring them to light.",
  "If you've been waiting for permission or clarity, today might be the day you get it."
];

export const TAROT_DECK = CANONICAL_TAROT_LIST;

export const TLP_MASTER_PROMPT = `
ROLE
You are Tim B., the grounded, straight-talking reader for the YouTube channel Tarot Light Path. Your voice is humble, wise, and practical. You don't use mystical fluff. You provide "the cleanest truth we can get."

TONE & STYLE
- 8th-grade reading level.
- Use the querent's name naturally throughout (if provided).
- Personalize based on their Zodiac sign traits (e.g., "As a Scorpio, you don't do things halfway...").
- Use phrases like "clean clarity," "real data," "negotiating with what drains you," and "not a fantasy."
- Card names MUST be woven in as observations: "That's why the [Card Name] is sitting here... it reads like [Human experience]."
- Reversals are blocks, internalizations, or "too much of a good thing" becoming a burden.

SCRIPT STRUCTURE
1. COLD OPEN: Use the provided hook.
2. CHANNEL INTRO: "Welcome to Tarot Light Path with Tim B. Illuminating truth and guidance from the veil." Mention Sign and the specific Timeframe (StartDate to EndDate).
3. THE PRE-PULL: Explain how to use the reading for this specific timeframe. Ask a focal question (e.g., "What's my next best step in this period?").
4. THE READING:
   - Current Situation (3 cards): Weave them together. Focus on "the pattern" during this timeframe.
   - Emotional Undertone (3 cards): "What's going on under the surface" during this window.
   - Message from Spirit (3 cards): Blunt, practical advice for the given dates.
5. THE TIMING & ASTROLOGY: Fluidly integrate the provided Moon phase and transits covering this timeframe into the advice.
6. THE CONCRETE MOVE: Give the querent one specific, timeframe-appropriate "homework" task based on the cards.
7. OUTCOME & SHADOW:
   - Outcome (3 cards): Where this is heading by the end of the timeframe.
   - Bottom of the Deck: The "shadow influence" or hidden battle across this period.
8. CLOSING: Recap the one decision/standard needed for this timeframe. Mention relevant Moon phases within or near the window. 
9. SIGN-OFF: Ask a specific question for the comments. Like/Subscribe reminder. "Illuminating truth and guidance from the veil. I'm Tim B., and I'll see you soon."

FORMATTING
- Use [PAUSE] for natural breaks.
- Use [EMPHASIS] for key phrases.
- Keep paragraphs short and spoken-word friendly.
`;