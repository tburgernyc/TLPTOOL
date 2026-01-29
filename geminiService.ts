import { AstrologyData, ReadingParams, Spread } from "./types";

export class TLPError extends Error {
  constructor(public message: string, public code?: string, public retryable: boolean = false) {
    super(message);
    this.name = 'TLPError';
  }
}

async function callApi(action: string, payload: any): Promise<any> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { error: response.statusText };
        }

        // Map common errors
        if (response.status === 429) {
            throw new TLPError("Celestial capacity reached. Rate limit exceeded.", "QUOTA_EXCEEDED", true);
        }
        if (response.status === 401 || response.status === 403) {
            throw new TLPError("Authentication failed. Protocol key invalid.", "AUTH_ERROR", false);
        }
        throw new TLPError(errorData.error || "Transmission failure.", errorData.code || "UNKNOWN", true);
    }
    return await response.json();
  } catch (error: any) {
    if (error instanceof TLPError) throw error;
    throw new TLPError(error.message || "Network transmission failure.", "NETWORK_ERROR", true);
  }
}

export async function fetchAstrology(startDate: string, endDate: string): Promise<AstrologyData> {
  return callApi('fetchAstrology', { startDate, endDate });
}

export async function generatePart1(params: ReadingParams, astrology: AstrologyData): Promise<string> {
  return callApi('generatePart1', { params, astrology });
}

export async function generatePart2(
  params: ReadingParams,
  astrology: AstrologyData,
  spread: Spread,
  introText: string
): Promise<string> {
  return callApi('generatePart2', { params, astrology, spread, introText });
}

export async function generateSpeech(text: string): Promise<string> {
  return callApi('generateSpeech', { text });
}
