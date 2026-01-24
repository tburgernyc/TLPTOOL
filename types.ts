export enum ReadingMode {
  COLLECTIVE = 'Automated Collective',
  SPECIFIC = 'Automated Specific Querent',
  MANUAL_COLLECTIVE = 'Manual Collective (Two-Part)',
  MANUAL_SPECIFIC = 'Manual Specific Querent (Two-Part)'
}

export enum ReadingLength {
  SHORT = 'Short',
  MEDIUM = 'Medium',
  DEEP = 'Deep'
}

export interface ReadingParams {
  sign: string;
  mode: ReadingMode;
  topic: string;
  startDate: string;
  endDate: string;
  length: ReadingLength;
  includeAudio: boolean;
  querentName?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
}

export interface TarotCard {
  name: string;
  orientation: 'Upright' | 'Reversed';
  imageUrl: string;
}

export interface Spread {
  situation: TarotCard[];
  feelings: TarotCard[];
  message: TarotCard[];
  outcome: TarotCard[];
  bottom: TarotCard;
}

export interface SpreadPreset {
  id: string;
  name: string;
  spread: Spread;
  createdAt: number;
}

export interface AstrologyData {
  moonPhase: string;
  transits: string[];
  retrogrades: string[];
  theme: string;
  details: string;
}

export interface GeneratedReading {
  id: string;
  params: ReadingParams;
  astrology: AstrologyData;
  spread: Spread;
  hook: string;
  introText?: string; 
  readingBody?: string; 
  fullScript: string;
  audioData?: string; 
  wordCount: number;
  createdAt: number;
}