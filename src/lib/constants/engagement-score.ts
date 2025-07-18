/**
 * Engagement Score Constants
 * These constants define the engagement score values and their corresponding labels
 */

export enum EngagementScore {
  AVOID = 1,
  POOR = 2,
  SUB_PAR = 3,
  BELOW_AVERAGE = 4,
  STANDARD = 5,
  GOOD = 6,
  STRONG = 7,
  STRONG_PLUS = 8,
  HIGH = 9,
  EXCEPTIONAL = 10,
}

export const ENGAGEMENT_SCORE_LABELS: Record<EngagementScore, string> = {
  [EngagementScore.AVOID]: "Avoid",
  [EngagementScore.POOR]: "Poor",
  [EngagementScore.SUB_PAR]: "Sub Par",
  [EngagementScore.BELOW_AVERAGE]: "Below Average",
  [EngagementScore.STANDARD]: "Standard",
  [EngagementScore.GOOD]: "Good",
  [EngagementScore.STRONG]: "Strong",
  [EngagementScore.STRONG_PLUS]: "Strong+",
  [EngagementScore.HIGH]: "High",
  [EngagementScore.EXCEPTIONAL]: "Exceptional",
};

export const ENGAGEMENT_SCORE_MIN = EngagementScore.AVOID;
export const ENGAGEMENT_SCORE_MAX = EngagementScore.EXCEPTIONAL;

/**
 * Get the label for a given engagement score
 */
export function getEngagementScoreLabel(score: number | undefined): string {
  if (!score || score < ENGAGEMENT_SCORE_MIN || score > ENGAGEMENT_SCORE_MAX) {
    return "-";
  }
  return ENGAGEMENT_SCORE_LABELS[score as EngagementScore];
}

/**
 * Engagement score options for form selects
 */
export const engagementScoreSelectOptions = Object.entries(ENGAGEMENT_SCORE_LABELS)
  .map(([value, label]) => ({
    value: parseInt(value),
    label: `${value} - ${label}`,
  }))
  .reverse(); // Show from highest to lowest in dropdowns