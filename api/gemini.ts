import { GoogleGenAI, Type, Modality } from "@google/genai";

// Inline constants to make the serverless function self-contained
// Vercel Serverless Functions cannot resolve relative imports to parent directories
const HOOK_PHRASES = [
  "If you've been second-guessing yourself lately, today is about turning the lights on—gently, but honestly.",
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

const TLP_MASTER_PROMPT = `
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

// Re-define enums/types locally to avoid strict dependency on client types if build differs
// or we can import them if the environment allows.
// For safety in a Vercel Serverless Function (which might not bundle sibling TS files correctly without configuration),
// we will cast payload to 'any' but keep logic consistent.

export function cleanScript(text: string): string {
  return text
    .replace(
      /(^(?:Here's your|Sure, here is|This script|I have generated|Certainly|Okay|Great|PART \d+:?|Section \d+:?).*$)|(\[(?:Stage direction|Pause slightly|Take a breath|Background music).*?\])|(\*\*(.*?)\*\*)/gim,
      (match, p1, p2, p3, p4) => {
        if (p1) return ''; // Remove intro lines
        if (p2) return '[PAUSE]'; // Standardize stage directions
        if (p3) return p4; // Unwrap bold text
        return match;
      }
    )
    .replace(/(\n{3,})/g, '\n\n')
    .trim();
}

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY missing' });
  }

  const ai = new GoogleGenAI({ apiKey });
  const { action, payload } = req.body || {};

  try {
    let result;

    if (action === 'fetchAstrology') {
      const { startDate, endDate } = payload;
      const timeframeDesc = startDate === endDate ? `on ${startDate}` : `for the period from ${startDate} to ${endDate}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Fetch verified astrological data ${timeframeDesc}. Cross-check against ephemeris data for Moon phase, transits (array of strings), retrogrades (array of strings), theme (short sentence), and details (detailed overview).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              moonPhase: { type: Type.STRING },
              transits: { type: Type.ARRAY, items: { type: Type.STRING } },
              retrogrades: { type: Type.ARRAY, items: { type: Type.STRING } },
              theme: { type: Type.STRING },
              details: { type: Type.STRING },
            },
            required: ["moonPhase", "transits", "retrogrades", "theme", "details"]
          }
        }
      });

      const text = response.text;
      try {
        result = JSON.parse(text || '{}');
      } catch (e) {
        throw new Error("Malformed celestial query data.");
      }

    } else if (action === 'generatePart1') {
      const { params, astrology } = payload;
      const randomHook = HOOK_PHRASES[Math.floor(Math.random() * HOOK_PHRASES.length)];
      const timeframe = params.startDate === params.endDate ? params.startDate : `${params.startDate} to ${params.endDate}`;

      const personalContext = params.querentName
        ? `SPECIFIC QUERENT MODE: Address ${params.querentName} personally. Integrate their sign ${params.sign}. Topic: ${params.topic}.`
        : `COLLECTIVE MODE: Address all ${params.sign} Sun, Moon, and Risings. Topic: ${params.topic}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${TLP_MASTER_PROMPT}
        TASK: GENERATE PART 1 ONLY (Intro & Hook).
        Context: ${personalContext}
        Timeframe: ${timeframe}
        Astro Theme: ${astrology.theme}
        REQUIRED STRUCTURE:
        1. COLD OPEN: Start with EXACTLY this phrase: "${randomHook}"
        2. CHANNEL ID: Welcome to Tarot Light Path with Tim B.
        3. PRE-PULL: Set the focus for this timeframe.
        DO NOT GENERATE THE CARD READING YET.`,
      });
      result = cleanScript(response.text || "");

    } else if (action === 'generatePart2') {
      const { params, astrology, spread, introText } = payload;
      // ReadingLength.DEEP check
      const isDeep = params.length === 'Deep';
      const model = isDeep ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      const timeframe = params.startDate === params.endDate ? params.startDate : `${params.startDate} to ${params.endDate}`;

      const personalContext = params.querentName
        ? `Address ${params.querentName} throughout. Integrate birth info: ${params.birthDate || 'N/A'}.`
        : `Collective address for ${params.sign} placements.`;

      const spreadDesc = `
      1. SITUATION: ${spread.situation.map((c: any) => `${c.name} (${c.orientation})`).join(', ')}
      2. FEELINGS: ${spread.feelings.map((c: any) => `${c.name} (${c.orientation})`).join(', ')}
      3. SPIRIT MSG: ${spread.message.map((c: any) => `${c.name} (${c.orientation})`).join(', ')}
      4. OUTCOME: ${spread.outcome.map((c: any) => `${c.name} (${c.orientation})`).join(', ')}
      5. SHADOW: ${spread.bottom.name} (${spread.bottom.orientation})
      `;

      const response = await ai.models.generateContent({
        model,
        contents: `${TLP_MASTER_PROMPT}
        TASK: GENERATE PART 2 ONLY (The Full Reading & Outro).
        DO NOT REPEAT THE INTRO. Start directly with the situation.

        Personalization Context: ${personalContext}
        Reading Context: ${params.sign} | ${params.topic} | ${timeframe}
        Astrology: ${astrology.moonPhase}, Transits: ${astrology.transits.join(', ')}
        Spread Matrix: ${spreadDesc}

        Target Length: ${params.length} depth.
        Insert [PAUSE] after every 2-3 sentences for natural breath.
        Insert [EMPHASIS] on key card names and takeaways.`,
        config: {
          thinkingConfig: isDeep ? { thinkingBudget: 4000 } : undefined
        }
      });
      result = cleanScript(response.text || "");

    } else if (action === 'generateSpeech') {
      const { text } = payload;
      const cleanText = text
        .replace(/\[PAUSE\]/g, '...')
        .replace(/\[EMPHASIS\]/g, '');

      // TTS has practical limits - use up to 4000 chars for a single request
      // This keeps the request fast enough for Vercel serverless function timeouts
      const MAX_TTS_CHARS = 4000;
      const truncatedText = cleanText.length > MAX_TTS_CHARS
        ? cleanText.substring(0, cleanText.lastIndexOf('. ', MAX_TTS_CHARS) + 1) || cleanText.substring(0, MAX_TTS_CHARS)
        : cleanText;

      console.log(`[TTS] Generating speech for ${truncatedText.length} of ${cleanText.length} chars`);

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: truncatedText }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          console.error('[TTS] No audio data in response');
          throw new Error("Vocal synthesis returned empty audio data.");
        }
        console.log(`[TTS] Audio generated: ${base64Audio.length} bytes`);
        result = base64Audio;
      } catch (ttsError: any) {
        console.error('[TTS] Speech generation failed:', ttsError.message);
        throw new Error(`TTS Error: ${ttsError.message || 'Unknown synthesis failure'}`);
      }

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json(result);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const status = error?.status || 500;
    const message = error?.message || 'Internal Server Error';
    res.status(status).json({ error: message, code: error?.code });
  }
}
