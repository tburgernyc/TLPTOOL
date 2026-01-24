import { GoogleGenAI, Type, GenerateContentParameters, Modality } from "@google/genai";
import { AstrologyData, ReadingParams, Spread, ReadingLength, ReadingMode } from "../types";
import { TLP_MASTER_PROMPT, HOOK_PHRASES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class TLPError extends Error {
  constructor(public message: string, public code?: string, public retryable: boolean = false) {
    super(message);
    this.name = 'TLPError';
  }
}

async function callGemini(params: GenerateContentParameters, maxRetries = 3): Promise<any> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.code;
      const message = error?.message?.toLowerCase() || "";
      
      if (message.includes('limit exceeded') || message.includes('quota') || status === 429 || status === 'RESOURCE_EXHAUSTED') {
        if (i === maxRetries - 1) {
          throw new TLPError("Celestial capacity reached. Rate limit exceeded.", "QUOTA_EXCEEDED", true);
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 2000));
        continue;
      }

      if (status === 401 || status === 403) {
        throw new TLPError("Authentication failed. Protocol key invalid.", "AUTH_ERROR", false);
      }

      if (status >= 500) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }

      throw new TLPError(error.message || "Transmission failure.", "UNKNOWN", true);
    }
  }
  
  throw new TLPError(`Transmission failed after ${maxRetries} attempts.`, "RETRY_EXHAUSTED", true);
}

function cleanScript(text: string): string {
  return text
    .replace(/^(Here's your|Sure, here is|This script|I have generated|Certainly|Okay|Great|PART \d+:?|Section \d+:?).*$/gim, '')
    .replace(/\[(Stage direction|Pause slightly|Take a breath|Background music).*?\]/gi, '[PAUSE]')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(\n{3,})/g, '\n\n')
    .trim();
}

export async function fetchAstrology(startDate: string, endDate: string): Promise<AstrologyData> {
  const timeframeDesc = startDate === endDate ? `on ${startDate}` : `for the period from ${startDate} to ${endDate}`;
  const response = await callGemini({
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

  try {
    return JSON.parse(response.text);
  } catch (e) {
    throw new TLPError("Malformed celestial query data.", "PARSE_ERROR", true);
  }
}

export async function generatePart1(params: ReadingParams, astrology: AstrologyData): Promise<string> {
  const randomHook = HOOK_PHRASES[Math.floor(Math.random() * HOOK_PHRASES.length)];
  const timeframe = params.startDate === params.endDate ? params.startDate : `${params.startDate} to ${params.endDate}`;
  
  const personalContext = params.querentName 
    ? `SPECIFIC QUERENT MODE: Address ${params.querentName} personally. Integrate their sign ${params.sign}. Topic: ${params.topic}.` 
    : `COLLECTIVE MODE: Address all ${params.sign} Sun, Moon, and Risings. Topic: ${params.topic}.`;

  const response = await callGemini({
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
  return cleanScript(response.text || "");
}

export async function generatePart2(
  params: ReadingParams,
  astrology: AstrologyData,
  spread: Spread,
  introText: string
): Promise<string> {
  const model = params.length === ReadingLength.DEEP ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const timeframe = params.startDate === params.endDate ? params.startDate : `${params.startDate} to ${params.endDate}`;
  const isDeep = params.length === ReadingLength.DEEP;

  const personalContext = params.querentName 
    ? `Address ${params.querentName} throughout. Integrate birth info: ${params.birthDate || 'N/A'}.` 
    : `Collective address for ${params.sign} placements.`;

  const spreadDesc = `
  1. SITUATION: ${spread.situation.map(c => `${c.name} (${c.orientation})`).join(', ')}
  2. FEELINGS: ${spread.feelings.map(c => `${c.name} (${c.orientation})`).join(', ')}
  3. SPIRIT MSG: ${spread.message.map(c => `${c.name} (${c.orientation})`).join(', ')}
  4. OUTCOME: ${spread.outcome.map(c => `${c.name} (${c.orientation})`).join(', ')}
  5. SHADOW: ${spread.bottom.name} (${spread.bottom.orientation})
  `;

  const response = await callGemini({
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
  return cleanScript(response.text || "");
}

export async function generateSpeech(text: string): Promise<string> {
  const cleanText = text.replace(/\[PAUSE\]/g, '...').replace(/\[EMPHASIS\]/g, '').substring(0, 5000);
  const response = await callGemini({
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
  if (!base64Audio) throw new TLPError("Vocal synthesis failure.", "TTS_ERROR", true);
  return base64Audio;
}