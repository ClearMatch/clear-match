"use client";

import { cn } from "@/lib/utils";

interface PriorityIndicatorProps {
  priorityLevel: string; // "1", "2", "3", "4"
  calculatedScore: number;
  priorityLabel: string;
  className?: string;
  showScore?: boolean;
  showTooltip?: boolean;
}

/**
 * Priority color and styling configuration based on calculated scores
 * Following the 6-level system from GitHub issue #146
 */
export const PRIORITY_CONFIG = {
  // 85-100: High Priority (Critical)
  critical: {
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-300",
    dotColor: "bg-red-500",
    range: "85-100",
  },
  // 68-84: High-Medium (High)
  high: {
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    borderColor: "border-orange-300",
    dotColor: "bg-orange-500",
    range: "68-84",
  },
  // 51-67: Medium
  medium: {
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-300",
    dotColor: "bg-yellow-500",
    range: "51-67",
  },
  // 34-50: Low-Medium (Low)
  low: {
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-300",
    dotColor: "bg-blue-500",
    range: "34-50",
  },
  // 17-33: Very Low
  veryLow: {
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-300",
    dotColor: "bg-gray-400",
    range: "17-33",
  },
  // 1-16: Extremely Low
  extremelyLow: {
    bgColor: "bg-gray-50",
    textColor: "text-gray-500",
    borderColor: "border-gray-200",
    dotColor: "bg-gray-300",
    range: "1-16",
  },
};

/**
 * Get priority configuration based on calculated score
 */
export function getPriorityConfig(calculatedScore: number) {
  if (calculatedScore >= 85) return PRIORITY_CONFIG.critical;
  if (calculatedScore >= 68) return PRIORITY_CONFIG.high;
  if (calculatedScore >= 51) return PRIORITY_CONFIG.medium;
  if (calculatedScore >= 34) return PRIORITY_CONFIG.low;
  if (calculatedScore >= 17) return PRIORITY_CONFIG.veryLow;
  return PRIORITY_CONFIG.extremelyLow;
}

/**
 * Get priority label based on calculated score
 */
export function getPriorityLabelByScore(calculatedScore: number): string {
  if (calculatedScore >= 85) return "Critical";
  if (calculatedScore >= 68) return "High";
  if (calculatedScore >= 51) return "Medium";
  if (calculatedScore >= 34) return "Low";
  if (calculatedScore >= 17) return "Very Low";
  return "Extremely Low";
}

/**
 * PriorityIndicator component displays priority with color-coded visual indicators
 */
export default function PriorityIndicator({
  priorityLevel,
  calculatedScore,
  priorityLabel,
  className,
  showScore = true,
  showTooltip = true,
}: PriorityIndicatorProps) {
  const config = getPriorityConfig(calculatedScore);

  const tooltipContent = showTooltip
    ? `Priority ${priorityLevel} (${priorityLabel})\nCalculated Score: ${calculatedScore}\nScore Range: ${config.range}`
    : undefined;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border cursor-help",
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
      title={tooltipContent}
    >
      {/* Priority level dot indicator */}
      <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />

      {/* Priority label and score */}
      <span className="font-semibold">
        {priorityLabel}
        {showScore && (
          <span className="ml-1 font-normal opacity-80">
            ({calculatedScore})
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * Compact version for table cells
 */
export function PriorityIndicatorCompact({
  priorityLevel,
  calculatedScore,
  priorityLabel,
  className,
}: Omit<PriorityIndicatorProps, "showScore" | "showTooltip">) {
  return (
    <PriorityIndicator
      priorityLevel={priorityLevel}
      calculatedScore={calculatedScore}
      priorityLabel={priorityLabel}
      className={cn("px-2 py-1 text-xs sm:px-3 sm:py-1", className)}
      showScore={true}
      showTooltip={false}
    />
  );
}

/**
 * Utility function to get priority display data for a task
 */
export function getPriorityDisplayData(
  priority: string | number,
  calculatedScore?: number
) {
  const priorityLevel = String(priority);
  const priorityMap = {
    "4": "Critical",
    "3": "High",
    "2": "Medium",
    "1": "Low",
  };

  const priorityLabel =
    priorityMap[priorityLevel as keyof typeof priorityMap] || "Low";
  const score = calculatedScore || parseInt(priorityLevel) * 20; // Fallback calculation

  return {
    priorityLevel,
    priorityLabel,
    calculatedScore: score,
  };
}
