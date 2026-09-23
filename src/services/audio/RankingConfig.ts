/**
 * RankingConfig — Centralized Popularity & Relevance Scoring System for ChillwithYT
 * 
 * Configurable weights:
 * A song suddenly becoming popular TODAY can move upward (velocity & engagement).
 * An old song with huge lifetime views does not automatically dominate every recommendation.
 */

export interface RankingWeights {
  velocity: number;     // Weight for view velocity (growth speed)
  engagement: number;   // Weight for likes/comments to views ratio
  popularity: number;   // Weight for normalized absolute popularity (log-scaled)
  freshness: number;    // Weight for upload recency (decay curve)
  relevance: number;    // Weight for language/region/tag match
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  velocity: 0.35,
  engagement: 0.25,
  popularity: 0.20,
  freshness: 0.10,
  relevance: 0.10,
};

export interface SongMetrics {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: string;
  prevViewCount?: number;
  refreshIntervalHours?: number;
}

export interface RankingContext {
  targetLanguage?: string;
  targetRegion?: string;
  songTitle?: string;
  artistName?: string;
  tags?: string[];
}

export interface CalculatedScores {
  velocityScore: number;
  engagementScore: number;
  popularityScore: number;
  freshnessScore: number;
  relevanceScore: number;
  finalScore: number;
  ageHours: number;
  ageDays: number;
}

// ─── Component Calculators ───────────────────────────────────────────────────

/**
 * Freshness Score (0 to 1)
 * Decays exponentially: fresh songs (< 7 days) score high, decaying toward 0 by 90 days.
 */
export function calculateFreshnessScore(publishedAt?: string): { freshnessScore: number; ageHours: number; ageDays: number } {
  if (!publishedAt) {
    return { freshnessScore: 0.5, ageHours: 168, ageDays: 7 };
  }

  const now = Date.now();
  const pubTime = new Date(publishedAt).getTime();
  const ageMs = Math.max(0, now - pubTime);
  const ageHours = ageMs / (1000 * 60 * 60);
  const ageDays = ageHours / 24;

  // Rapid bonus for very fresh (< 3 days = 1.0 -> 0.85, 7 days = 0.7, 30 days = 0.35, 90+ days = 0.05)
  const freshnessScore = Math.max(0.02, Math.exp(-ageDays / 25));

  return {
    freshnessScore: Math.round(freshnessScore * 1000) / 1000,
    ageHours: Math.round(ageHours),
    ageDays: Math.round(ageDays * 10) / 10,
  };
}

/**
 * View Velocity Score (0 to 1)
 * Measures views per day since upload and recent growth between refreshes.
 * Allows a video that launched 2 days ago with 500k views to outrank a 5-year-old video with 50M views.
 */
export function calculateVelocityScore(
  viewCount: number,
  ageDays: number,
  prevViewCount?: number,
  refreshIntervalHours?: number
): number {
  if (viewCount <= 0) return 0;

  // Views per day normalized on a log scale (10,000 views/day = 0.57, 100,000 = 0.71, 1M/day = 0.86, 10M/day = 1.0)
  const effectiveAgeDays = Math.max(0.2, ageDays); // at least ~5 hours
  const viewsPerDay = viewCount / effectiveAgeDays;
  const velocityBase = Math.min(1, Math.log10(Math.max(10, viewsPerDay)) / 7);

  // Delta growth velocity if we have previous check
  let growthDelta = 0;
  if (prevViewCount && prevViewCount > 0 && refreshIntervalHours && refreshIntervalHours > 0) {
    const rawGrowth = (viewCount - prevViewCount) / prevViewCount;
    // Standardize to 24-hour rate
    growthDelta = Math.min(1, Math.max(0, rawGrowth * (24 / refreshIntervalHours)));
  }

  const combined = growthDelta > 0 ? (velocityBase * 0.6 + growthDelta * 0.4) : velocityBase;
  return Math.round(Math.min(1, Math.max(0, combined)) * 1000) / 1000;
}

/**
 * Engagement Score (0 to 1)
 * Uses the ratio of (likes + comments * 2) to total views.
 * High engagement indicates passionate listener retention rather than passive autoplay.
 */
export function calculateEngagementScore(viewCount: number, likeCount: number, commentCount: number): number {
  if (viewCount <= 0) return 0;

  // Average healthy YouTube music engagement is 1.5% - 5%
  // Anything > 5% is stellar engagement
  const weightedInteractions = likeCount + (commentCount * 2.5);
  const ratio = weightedInteractions / viewCount; // e.g. 0.035 for 3.5%
  // Normalize: 5% ratio yields score ~0.85, 8% yields 1.0
  const normalized = Math.min(1, ratio / 0.06);

  return Math.round(normalized * 1000) / 1000;
}

/**
 * Absolute Popularity Score (0 to 1)
 * Normalized log scale:
 * 100K = 0.58
 * 1M   = 0.70
 * 10M  = 0.82
 * 100M = 0.94
 * 500M = 1.0
 */
export function calculatePopularityScore(viewCount: number): number {
  if (viewCount <= 0) return 0;
  const score = Math.min(1, Math.log10(Math.max(10, viewCount)) / 8.7);
  return Math.round(score * 1000) / 1000;
}

/**
 * Relevance Score (0 to 1)
 * Evaluates language keywords, regional tokens, and artist match.
 */
export function calculateRelevanceScore(context?: RankingContext): number {
  if (!context) return 0.5;

  let score = 0.5;
  const targetLang = context.targetLanguage?.toLowerCase();
  const text = `${context.songTitle || ''} ${context.artistName || ''} ${(context.tags || []).join(' ')}`.toLowerCase();

  if (targetLang && targetLang !== 'all') {
    if (text.includes(targetLang)) {
      score += 0.35;
    }

    // Common Indian regional language markers
    const langMarkers: Record<string, string[]> = {
      malayalam: ['kerala', 'mollywood', 'sushin', 'malayalam', 'vineeth', 'jakes', 'rex'],
      tamil: ['kollywood', 'anirudh', 'tamil', 'chennai', 'ar rahman', 'yuvan', 'harris'],
      telugu: ['tollywood', 'dsp', 'thaman', 'telugu', 'hyderabad', 'sid sriram'],
      hindi: ['bollywood', 'arijit', 'hindi', 'pritam', 'shreya', 't-series', 'zeemusic'],
      punjabi: ['punjabi', 'diljit', 'aujla', 'punjab', 'karan', 'ap dhillon', 'shubh'],
      kannada: ['sandalwood', 'kannada', 'bangalore', 'charan', 'ravi basrur'],
      bengali: ['bengali', 'bangla', 'kolkata', 'anupam'],
    };

    const markers = langMarkers[targetLang] || [];
    const hasMarker = markers.some(m => text.includes(m));
    if (hasMarker) {
      score += 0.15;
    }
  }

  return Math.round(Math.min(1, score) * 1000) / 1000;
}

/**
 * Central Popularity & Relevance Score
 * Combines all factors according to the configurable weights.
 */
export function calculateCompositeScore(
  metrics: SongMetrics,
  context?: RankingContext,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS
): CalculatedScores {
  const { freshnessScore, ageHours, ageDays } = calculateFreshnessScore(metrics.publishedAt);
  const velocityScore = calculateVelocityScore(metrics.viewCount, ageDays, metrics.prevViewCount, metrics.refreshIntervalHours);
  const engagementScore = calculateEngagementScore(metrics.viewCount, metrics.likeCount, metrics.commentCount);
  const popularityScore = calculatePopularityScore(metrics.viewCount);
  const relevanceScore = calculateRelevanceScore(context);

  const finalScore =
    weights.velocity * velocityScore +
    weights.engagement * engagementScore +
    weights.popularity * popularityScore +
    weights.freshness * freshnessScore +
    weights.relevance * relevanceScore;

  return {
    velocityScore,
    engagementScore,
    popularityScore,
    freshnessScore,
    relevanceScore,
    finalScore: Math.round(finalScore * 1000) / 1000,
    ageHours,
    ageDays,
  };
}
