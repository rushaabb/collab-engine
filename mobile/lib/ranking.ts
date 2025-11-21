import { User, Collab } from './supabase-types';
import { parseCardData } from './supabase-helpers';

/**
 * Rule-based ranking algorithm for collabs
 * 
 * Weights:
 * - Tag overlap: HIGH (40 points max)
 * - Follower tier compatibility: MEDIUM (30 points max)
 * - Recent activity: LOW-MEDIUM (20 points max)
 * - Reliability: LOW (10 points max)
 * 
 * Total: 100 points max
 */

interface RankingWeights {
  tagOverlap: number;        // HIGH
  followerTier: number;       // MEDIUM
  recentActivity: number;     // LOW-MEDIUM
  reliability: number;       // LOW
}

const DEFAULT_WEIGHTS: RankingWeights = {
  tagOverlap: 40,      // HIGH priority
  followerTier: 30,    // MEDIUM priority
  recentActivity: 20,  // LOW-MEDIUM priority
  reliability: 10,     // LOW priority
};

interface RankedCollab extends Collab {
  matchScore: number;
  rankingBreakdown: {
    tagOverlap: number;
    followerTier: number;
    recentActivity: number;
    reliability: number;
  };
}

/**
 * Calculate tag overlap score
 * Compares user's niche_tags and style_tags with collab creator's tags
 */
function calculateTagOverlap(
  userTags: string[],
  creatorTags: string[],
  collabCardData: any
): number {
  let score = 0;
  const maxScore = DEFAULT_WEIGHTS.tagOverlap;

  // Get tags from collab card data if available
  const collabTags = collabCardData?.tags || [];
  const allCollabTags = [...creatorTags, ...collabTags];

  if (allCollabTags.length === 0 || userTags.length === 0) {
    return 0;
  }

  // Count overlapping tags (case-insensitive)
  const userTagsLower = userTags.map(t => t.toLowerCase());
  const collabTagsLower = allCollabTags.map(t => t.toLowerCase());
  
  const overlaps = userTagsLower.filter(userTag => 
    collabTagsLower.some(collabTag => 
      collabTag.includes(userTag) || userTag.includes(collabTag)
    )
  );

  // Score based on overlap percentage
  const overlapRatio = overlaps.length / Math.max(userTags.length, allCollabTags.length);
  score = Math.round(overlapRatio * maxScore);

  // Bonus for exact matches
  const exactMatches = userTagsLower.filter(userTag => 
    collabTagsLower.includes(userTag)
  );
  score += Math.min(exactMatches.length * 2, maxScore * 0.2);

  return Math.min(score, maxScore);
}

/**
 * Calculate follower tier compatibility score
 * Matches users with similar follower buckets
 */
function calculateFollowerTierCompatibility(
  userBucket: string | null,
  creatorBucket: string | null
): number {
  const maxScore = DEFAULT_WEIGHTS.followerTier;

  if (!userBucket || !creatorBucket) {
    return maxScore * 0.3; // Partial score if one is missing
  }

  // Exact match
  if (userBucket === creatorBucket) {
    return maxScore;
  }

  // Parse bucket ranges for proximity matching
  const parseBucket = (bucket: string): { min: number; max: number } | null => {
    if (bucket === '0-1k') return { min: 0, max: 1000 };
    if (bucket === '1k-10k') return { min: 1000, max: 10000 };
    if (bucket === '10k-50k') return { min: 10000, max: 50000 };
    if (bucket === '50k-100k') return { min: 50000, max: 100000 };
    if (bucket === '100k+') return { min: 100000, max: Infinity };
    return null;
  };

  const userRange = parseBucket(userBucket);
  const creatorRange = parseBucket(creatorBucket);

  if (!userRange || !creatorRange) {
    return maxScore * 0.5; // Default compatibility
  }

  // Check if ranges overlap or are adjacent
  const rangesOverlap = 
    (userRange.min <= creatorRange.max && userRange.max >= creatorRange.min) ||
    Math.abs(userRange.min - creatorRange.min) < Math.max(userRange.max, creatorRange.max) * 0.5;

  if (rangesOverlap) {
    return maxScore * 0.8; // High compatibility
  }

  // Calculate distance between ranges
  const distance = Math.min(
    Math.abs(userRange.min - creatorRange.max),
    Math.abs(creatorRange.min - userRange.max)
  );
  const maxDistance = Math.max(userRange.max, creatorRange.max);
  const proximity = 1 - (distance / maxDistance);

  return Math.round(proximity * maxScore * 0.6);
}

/**
 * Calculate recent activity score
 * Based on how recently the collab was created and creator's activity
 */
function calculateRecentActivity(
  collabCreatedAt: string,
  creatorCompletedCollabs: number
): number {
  const maxScore = DEFAULT_WEIGHTS.recentActivity;
  let score = 0;

  // Recency score (0-60% of max)
  const now = new Date().getTime();
  const created = new Date(collabCreatedAt).getTime();
  const daysSinceCreation = (now - created) / (1000 * 60 * 60 * 24);

  if (daysSinceCreation < 1) {
    score += maxScore * 0.6; // Very recent
  } else if (daysSinceCreation < 7) {
    score += maxScore * 0.4; // This week
  } else if (daysSinceCreation < 30) {
    score += maxScore * 0.2; // This month
  } else {
    score += maxScore * 0.1; // Older
  }

  // Activity level score (0-40% of max)
  // More completed collabs = more active creator
  if (creatorCompletedCollabs > 10) {
    score += maxScore * 0.4; // Very active
  } else if (creatorCompletedCollabs > 5) {
    score += maxScore * 0.3; // Active
  } else if (creatorCompletedCollabs > 0) {
    score += maxScore * 0.2; // Some activity
  } else {
    score += maxScore * 0.1; // New creator
  }

  return Math.min(Math.round(score), maxScore);
}

/**
 * Calculate reliability score
 * Based on creator's reliability_score
 */
function calculateReliabilityScore(creatorReliability: number): number {
  const maxScore = DEFAULT_WEIGHTS.reliability;
  
  // Normalize reliability score (0-100) to ranking score (0-maxScore)
  // Reliability scores are already 0-100, so we scale them
  return Math.round((creatorReliability / 100) * maxScore);
}

/**
 * Rank collabs based on user profile and collab data
 */
export function rankCollabs(
  user: User,
  collabs: Collab[],
  creators: Map<string, User>
): RankedCollab[] {
  return collabs
    .map(collab => {
      const creator = creators.get(collab.creator1);
      if (!creator) {
        return {
          ...collab,
          matchScore: 0,
          rankingBreakdown: {
            tagOverlap: 0,
            followerTier: 0,
            recentActivity: 0,
            reliability: 0,
          },
        };
      }

      const cardData = parseCardData(collab.card_data || {});

      // Calculate each ranking factor
      const tagOverlap = calculateTagOverlap(
        [...user.niche_tags, ...user.style_tags],
        [...creator.niche_tags, ...creator.style_tags],
        cardData
      );

      const followerTier = calculateFollowerTierCompatibility(
        user.follower_bucket,
        creator.follower_bucket
      );

      const recentActivity = calculateRecentActivity(
        collab.created_at,
        creator.completed_collabs
      );

      const reliability = calculateReliabilityScore(creator.reliability_score);

      // Total score
      const matchScore = tagOverlap + followerTier + recentActivity + reliability;

      return {
        ...collab,
        matchScore,
        rankingBreakdown: {
          tagOverlap,
          followerTier,
          recentActivity,
          reliability,
        },
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get ranking explanation for debugging/display
 */
export function getRankingExplanation(breakdown: RankedCollab['rankingBreakdown']): string {
  const parts = [];
  if (breakdown.tagOverlap > 0) {
    parts.push(`Tags: ${breakdown.tagOverlap}pts`);
  }
  if (breakdown.followerTier > 0) {
    parts.push(`Follower tier: ${breakdown.followerTier}pts`);
  }
  if (breakdown.recentActivity > 0) {
    parts.push(`Activity: ${breakdown.recentActivity}pts`);
  }
  if (breakdown.reliability > 0) {
    parts.push(`Reliability: ${breakdown.reliability}pts`);
  }
  return parts.join(' • ') || 'No match';
}

