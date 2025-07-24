import { activityTypeOptions } from "./constants";

export const EVENT_IMPORTANCE_MAPPING = {
  // Highest Importance (10)
  "new-job-posting": 10,

  // High Importance (9)
  "open-to-work": 9,
  "laid-off": 9,
  interview: 9,

  // Medium-High Importance (8)
  "funding-news": 8,
  "company-layoffs": 8,
  birthday: 8,
  meeting: 8,

  // Medium Importance (6)
  "m-and-a-activity": 6,
  "email-reply-received": 6,
  "follow-up": 6,
  call: 6,
  video: 6,

  // Low Importance (4)
  holiday: 4,
  "personal-interest-tag": 4,
  email: 4,
  text: 4,

  // Lowest Importance (2)
  "dormant-status": 2,
} as const;

export type EventType = keyof typeof EVENT_IMPORTANCE_MAPPING;

/**
 * Priority Calculation Result Interface
 */
export interface PriorityCalculationResult {
  engagementScore: number;
  eventImportance: number;
  calculatedScore: number;
  priorityLevel: string;
  priorityLabel: string;
  calculation: string;
  explanation: string;
}

/**
 * Get event importance score based on activity type
 */
export function getEventImportanceScore(activityType: string): number {
  return EVENT_IMPORTANCE_MAPPING[activityType as EventType] || 5; // Default to 5 if unknown
}

/**
 * Get engagement score from contact data
 * This function should be called with the contact's engagement_score from database
 */
export async function getEngagementScoreFromContact(
  contactId: string
): Promise<number> {
  try {
    // Import supabase client dynamically to avoid SSR issues
    const { supabase } = await import("@/lib/supabase");

    const { data: contact, error } = await supabase
      .from("contacts")
      .select("engagement_score")
      .eq("id", contactId)
      .single();

    if (error) {
      console.warn("Error fetching contact engagement score:", error);
      return 5; // Default medium engagement
    }

    // Return the engagement score (1-10 scale) or default to 5
    if (
      contact?.engagement_score &&
      contact.engagement_score >= 1 &&
      contact.engagement_score <= 10
    ) {
      return contact.engagement_score;
    }

    return 5; // Default medium engagement
  } catch (error) {
    console.warn("Error in getEngagementScoreFromContact:", error);
    return 5; // Default medium engagement
  }
}

/**
 * Convert priority score to priority level using 4-level system
 * Maps to existing priority options: 4=Critical, 3=High, 2=Medium, 1=Low
 */
export function getScoreToPriorityLevel(score: number): string {
  if (score >= 80) return "4"; // Critical
  if (score >= 60) return "3"; // High
  if (score >= 40) return "2"; // Medium
  return "1"; // Low
}

/**
 * Get priority label from priority level
 */
export function getPriorityLabel(level: string): string {
  const priorityMap = {
    "4": "Critical",
    "3": "High",
    "2": "Medium",
    "1": "Low",
  };
  return priorityMap[level as keyof typeof priorityMap] || "Low";
}

/**
 * Calculate priority based on engagement score and event importance
 * Main function for the priority calculation system
 */
export function calculateTaskPriority(
  engagementScore: number,
  activityType: string
): PriorityCalculationResult {
  // Get event importance score
  const eventImportance = getEventImportanceScore(activityType);

  // Calculate priority score: engagement × event_importance
  const calculatedScore = engagementScore * eventImportance;

  // Map to priority level
  const priorityLevel = getScoreToPriorityLevel(calculatedScore);

  // Get priority label
  const priorityLabel = getPriorityLabel(priorityLevel);

  // Create calculation string
  const calculation = `${engagementScore} × ${eventImportance} = ${calculatedScore}`;

  // Create explanation
  const explanation = `Score ${calculatedScore} maps to Priority ${priorityLevel} (${priorityLabel})`;

  return {
    engagementScore,
    eventImportance,
    calculatedScore,
    priorityLevel,
    priorityLabel,
    calculation,
    explanation,
  };
}

/**
 * Calculate priority for task form
 * This is the main function to be used in the task form
 */
export async function calculateTaskPriorityForForm(
  contactId: string,
  activityType: string
): Promise<PriorityCalculationResult> {
  // Get engagement score from contact
  const engagementScore = await getEngagementScoreFromContact(contactId);

  // Calculate priority
  return calculateTaskPriority(engagementScore, activityType);
}

/**
 * Validate if activity type has importance mapping
 */
export function isValidActivityType(activityType: string): boolean {
  return activityType in EVENT_IMPORTANCE_MAPPING;
}

/**
 * Get all available activity types with their importance scores
 */
export function getActivityTypesWithImportance(): Array<{
  value: string;
  label: string;
  importance: number;
}> {
  return activityTypeOptions.map((option) => ({
    value: option.value,
    label: option.label,
    importance: getEventImportanceScore(option.value),
  }));
}
