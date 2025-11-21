import { supabase } from './supabase';

export interface ReliabilityMetrics {
  responseTime: number; // Average response time in hours
  completionRate: number; // Percentage of completed collabs
  abandonedCount: number; // Number of abandoned collaborations
  totalScore: number; // Overall reliability score 0-100
}

export async function calculateReliabilityScore(userId: string): Promise<ReliabilityMetrics> {
  try {
    // Get user's messages to calculate response time
    const { data: messages } = await supabase
      .from('messages')
      .select('created_at, sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    let totalResponseTime = 0;
    let responseCount = 0;

    if (messages && messages.length > 1) {
      for (let i = 1; i < messages.length; i++) {
        const prev = messages[i - 1];
        const curr = messages[i];
        
        // If previous message was to this user and current is from this user
        if (prev.receiver_id === userId && curr.sender_id === userId) {
          const timeDiff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
          const hours = timeDiff / (1000 * 60 * 60);
          totalResponseTime += hours;
          responseCount++;
        }
      }
    }

    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    // Get collab statistics
    const { data: collabs } = await supabase
      .from('collabs')
      .select('status')
      .or(`creator_id.eq.${userId},collaborator_id.eq.${userId}`);

    const totalCollabs = collabs?.length || 0;
    const completedCollabs = collabs?.filter(c => c.status === 'completed').length || 0;
    const abandonedCollabs = collabs?.filter(c => c.status === 'cancelled').length || 0;

    const completionRate = totalCollabs > 0 
      ? (completedCollabs / totalCollabs) * 100 
      : 0;

    // Calculate total score
    let score = 50; // Base score

    // Response time bonus/penalty
    if (avgResponseTime < 24) score += 20; // Fast responder
    else if (avgResponseTime < 48) score += 10;
    else if (avgResponseTime > 72) score -= 10; // Slow responder

    // Completion rate bonus/penalty
    if (completionRate >= 80) score += 20;
    else if (completionRate >= 60) score += 10;
    else if (completionRate < 40) score -= 15;

    // Abandoned collabs penalty
    score -= abandonedCollabs * 5;
    if (abandonedCollabs > totalCollabs * 0.3) score -= 20; // High abandonment rate

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return {
      responseTime: avgResponseTime,
      completionRate,
      abandonedCount: abandonedCollabs,
      totalScore: Math.round(score),
    };
  } catch (error) {
    console.error('Error calculating reliability score:', error);
    return {
      responseTime: 0,
      completionRate: 0,
      abandonedCount: 0,
      totalScore: 50,
    };
  }
}

export async function updateUserReliabilityScore(userId: string) {
  try {
    const metrics = await calculateReliabilityScore(userId);
    
    await supabase
      .from('profiles')
      .update({
        reliability_score: metrics.totalScore,
        avg_response_time: metrics.responseTime,
        completion_rate: metrics.completionRate,
        abandoned_collabs: metrics.abandonedCount,
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Error updating reliability score:', error);
  }
}

