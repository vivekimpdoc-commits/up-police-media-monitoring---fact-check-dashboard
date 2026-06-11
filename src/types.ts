export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  date: string; // YYYY-MM-DD
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  sentimentReason?: string;
  summary?: string;
  tags?: string[];
  impactLevel?: 'High' | 'Medium' | 'Low';
  recommendedAction?: string;
  
  // Fact-Check details (if checked)
  factCheckStatus?: 'Verified' | 'Partially True' | 'Misleading' | 'Fake' | 'Unverified';
  factCheckConfidence?: number; // 0 - 100
  factCheckColor?: string;
  factCheckAnalysis?: string;
  factCheckActionPlan?: string[];
  factCheckReferences?: string[];
  lastCheckedAt?: string;
}

export interface MediaAlert {
  id: string;
  type: 'Critical' | 'Warning' | 'Positive';
  headline: string;
  timestamp: string;
  channel: string; // "Social Media" | "Print Media" | "TV Channel"
  handled: boolean;
}

export interface SentimentPieData {
  name: string;
  value: number;
  color: string;
}
