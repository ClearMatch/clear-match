import { getEventImportanceScore } from "../Common/priorityCalculation";
import { ActivityWithRelations } from "../Services/Types";

export interface ActivityWithPriorityScore extends ActivityWithRelations {
  calculated_priority_score?: number;
}

export function calculateTaskPriorityScore(
  task: ActivityWithRelations,
  engagementScore?: number
): number {
  // Use provided engagement score or default to 5 (medium)
  const engagement = engagementScore || task.contacts?.engagement_score || 5;
  const eventImportance = getEventImportanceScore(task.type);

  return engagement * eventImportance;
}

export function getTaskPriorityDisplayData(
  task: ActivityWithRelations,
  engagementScore?: number
) {
  const calculatedScore = calculateTaskPriorityScore(task, engagementScore);

  const priorityMap = {
    4: "Critical",
    3: "High",
    2: "Medium",
    1: "Low",
  };

  const priorityLabel =
    priorityMap[task.priority as keyof typeof priorityMap] || "Low";

  return {
    priorityLevel: String(task.priority),
    priorityLabel,
    calculatedScore,
    engagementScore: engagementScore || task.contacts?.engagement_score || 5,
    eventImportance: getEventImportanceScore(task.type),
  };
}

export function sortTasksByPriorityScore(
  tasks: ActivityWithRelations[],
  engagementScores?: Record<string, number>
): ActivityWithRelations[] {
  return [...tasks].sort((a, b) => {
    const scoreA = calculateTaskPriorityScore(
      a,
      engagementScores?.[a.contact_id || ""] || a.contacts?.engagement_score
    );
    const scoreB = calculateTaskPriorityScore(
      b,
      engagementScores?.[b.contact_id || ""] || b.contacts?.engagement_score
    );

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Group tasks by priority range for filtering
 */
export function groupTasksByPriorityRange(tasks: ActivityWithRelations[]) {
  const groups = {
    critical: [] as ActivityWithRelations[], // 85-100
    high: [] as ActivityWithRelations[], // 68-84
    medium: [] as ActivityWithRelations[], // 51-67
    low: [] as ActivityWithRelations[], // 34-50
    veryLow: [] as ActivityWithRelations[], // 17-33
    extremelyLow: [] as ActivityWithRelations[], // 1-16
  };

  tasks.forEach((task) => {
    const score = calculateTaskPriorityScore(task);

    if (score >= 85) groups.critical.push(task);
    else if (score >= 68) groups.high.push(task);
    else if (score >= 51) groups.medium.push(task);
    else if (score >= 34) groups.low.push(task);
    else if (score >= 17) groups.veryLow.push(task);
    else groups.extremelyLow.push(task);
  });

  return groups;
}

/**
 * Batch calculate priority scores for multiple tasks
 */
export async function batchCalculatePriorityScores(
  tasks: ActivityWithRelations[]
): Promise<Record<string, number>> {
  const scores: Record<string, number> = {};

  // Group tasks by contact to minimize database queries
  const tasksByContact: Record<string, ActivityWithRelations[]> = {};

  tasks.forEach((task) => {
    if (task.contact_id) {
      if (!tasksByContact[task.contact_id]) {
        tasksByContact[task.contact_id] = [];
      }
      tasksByContact[task.contact_id]?.push(task);
    }
  });

  // Calculate scores for each task
  tasks.forEach((task) => {
    scores[task.id] = calculateTaskPriorityScore(task);
  });

  return scores;
}
