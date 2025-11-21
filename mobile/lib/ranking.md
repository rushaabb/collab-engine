# Ranking Algorithm Documentation

## Overview

The discovery feed uses a rule-based ranking algorithm to match users with relevant collaborations. The algorithm considers four factors with different priority weights.

## Ranking Factors

### 1. Tag Overlap (HIGH Priority - 40 points max)

**Weight**: 40% of total score

**Calculation**:
- Compares user's `niche_tags` and `style_tags` with creator's tags
- Also considers tags from the collab's `card_data.tags`
- Uses case-insensitive matching with partial matching support
- Scores based on overlap percentage
- Bonus points for exact tag matches

**Scoring**:
- Overlap ratio × 40 points
- +2 points per exact match (max 8 bonus points)

**Example**:
- User tags: `['Tech', 'Art', 'Design']`
- Creator tags: `['Tech', 'Fashion']`
- Collab tags: `['Art', 'Creative']`
- Overlap: `['Tech', 'Art']` = 2 matches
- Score: ~26-30 points

### 2. Follower Tier Compatibility (MEDIUM Priority - 30 points max)

**Weight**: 30% of total score

**Calculation**:
- Compares user's `follower_bucket` with creator's `follower_bucket`
- Supports buckets: `0-1k`, `1k-10k`, `10k-50k`, `50k-100k`, `100k+`
- Exact match = full points
- Overlapping/adjacent ranges = 80% of points
- Calculates proximity for distant ranges

**Scoring**:
- Exact match: 30 points
- Overlapping ranges: 24 points
- Adjacent ranges: 18-24 points (based on proximity)
- Distant ranges: 0-12 points (based on distance)

**Example**:
- User: `1k-10k`
- Creator: `1k-10k` → 30 points (exact match)
- Creator: `10k-50k` → ~24 points (adjacent)
- Creator: `100k+` → ~6 points (distant)

### 3. Recent Activity (LOW-MEDIUM Priority - 20 points max)

**Weight**: 20% of total score

**Calculation**:
- **Recency** (60% of this factor): Based on collab creation date
  - < 1 day: 12 points
  - < 7 days: 8 points
  - < 30 days: 4 points
  - 30+ days: 2 points

- **Activity Level** (40% of this factor): Based on creator's completed collabs
  - 10+ completed: 8 points
  - 5-9 completed: 6 points
  - 1-4 completed: 4 points
  - 0 completed: 2 points

**Scoring**:
- Total = Recency score + Activity score (max 20 points)

**Example**:
- Collab created 2 days ago: 8 points (recency)
- Creator has 7 completed collabs: 6 points (activity)
- Total: 14 points

### 4. Reliability (LOW Priority - 10 points max)

**Weight**: 10% of total score

**Calculation**:
- Uses creator's `reliability_score` (0-100)
- Normalized to 0-10 points
- Formula: `(reliability_score / 100) × 10`

**Scoring**:
- Reliability 100: 10 points
- Reliability 80: 8 points
- Reliability 50: 5 points
- Reliability 0: 0 points

## Total Score

Maximum possible score: **100 points**

Score breakdown:
- Tag Overlap: 0-40 points
- Follower Tier: 0-30 points
- Recent Activity: 0-20 points
- Reliability: 0-10 points

## Ranking Process

1. Load all pending collabs
2. Load creator profiles for each collab
3. For each collab, calculate all four factors
4. Sum factors to get total match score
5. Sort by score (descending)
6. Return top 50 ranked collabs

## Usage

```typescript
import { rankCollabs } from '@/lib/ranking';

const ranked = rankCollabs(currentUser, collabs, creatorMap);
// Returns sorted array with matchScore and rankingBreakdown
```

## Debugging

Each ranked collab includes a `rankingBreakdown` object:

```typescript
{
  matchScore: 75,
  rankingBreakdown: {
    tagOverlap: 35,
    followerTier: 24,
    recentActivity: 12,
    reliability: 8
  }
}
```

Use `getRankingExplanation()` to get a human-readable breakdown:

```typescript
import { getRankingExplanation } from '@/lib/ranking';
const explanation = getRankingExplanation(ranked[0].rankingBreakdown);
// "Tags: 35pts • Follower tier: 24pts • Activity: 12pts • Reliability: 8pts"
```

