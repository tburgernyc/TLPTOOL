import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TLP_MASTER_PROMPT, HOOK_PHRASES } from "../constants";

// Re-define enums/types locally to avoid strict dependency on client types if build differs
// or we can import them if the environment allows.
// For safety in a Vercel Serverless Function (which might not bundle sibling TS files correctly without configuration),
// we will cast payload to 'any' but keep logic consistent.

function cleanScript(text: string): string {
  return text
    .replace(/^(Here's your|Sure, here is|This script|I have generated|Certainly|Okay|Great|PART \d+:?|Section \d+:?).*$/gim, '')
    .replace(/\[(Stage direction|Pause slightly|Take a breath|Background music).*?\]/gi, '[PAUSE]')
    .replace(/\*\*(.*?)\*\*/g, '$1')
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

      const text = response.text();
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
      result = cleanScript(response.text() || "");

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
      result = cleanScript(response.text() || "");

    } else if (action === 'generateSpeech') {
      const { text } = payload;
      const cleanText = text.replace(/\[PAUSE\]/g, '...').replace(/\[EMPHASIS\]/g, '').substring(0, 5000);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak this tarot script in a grounded male voice: ${cleanText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("Vocal synthesis failure.");
      result = base64Audio;

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
