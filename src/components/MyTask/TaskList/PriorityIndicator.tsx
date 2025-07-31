"use client";

import { cn } from "@/lib/utils";

interface PriorityIndicatorProps {
  priority: number;
  className?: string;
  showTooltip?: boolean;
  creationType?: "manual" | "automatic";
  calculatedScore?: number;
}

/**
 * Manual task priority configuration (4-level system)
 */
export const MANUAL_PRIORITY_CONFIG = {
  1: {
    label: "Low",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-300",
    dotColor: "bg-green-500",
  },
  2: {
    label: "Medium",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-300",
    dotColor: "bg-yellow-500",
  },
  3: {
    label: "High",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    borderColor: "border-orange-300",
    dotColor: "bg-orange-500",
  },
  4: {
    label: "Critical",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-300",
    dotColor: "bg-red-500",
  },
};

/**
 * Automatic task priority configuration (6-level system based on calculated scores)
 */
export const AUTO_PRIORITY_CONFIG = {
  6: {
    // 85-100: Critical
    label: "Critical",
    bgColor: "bg-red-100",
    textColor: "text-red-900",
    borderColor: "border-red-400",
    dotColor: "bg-red-600",
    scoreRange: "85-100",
  },
  5: {
    // 68-84: High
    label: "High",
    bgColor: "bg-orange-100",
    textColor: "text-orange-900",
    borderColor: "border-orange-400",
    dotColor: "bg-orange-600",
    scoreRange: "68-84",
  },
  4: {
    // 51-67: Medium
    label: "Medium",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-900",
    borderColor: "border-yellow-400",
    dotColor: "bg-yellow-600",
    scoreRange: "51-67",
  },
  3: {
    // 34-50: Low-Medium
    label: "Low-Medium",
    bgColor: "bg-blue-100",
    textColor: "text-blue-900",
    borderColor: "border-blue-400",
    dotColor: "bg-blue-500",
    scoreRange: "34-50",
  },
  2: {
    // 17-33: Low
    label: "Low",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-400",
    dotColor: "bg-gray-500",
    scoreRange: "17-33",
  },
  1: {
    // 1-16: Very Low
    label: "Very Low",
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    borderColor: "border-gray-300",
    dotColor: "bg-gray-400",
    scoreRange: "1-16",
  },
};

/**
 * Convert calculated score to priority level for automatic tasks (1-6)
 */
export function getAutoPriorityLevel(calculatedScore: number): number {
  if (calculatedScore >= 85) return 6; // Critical
  if (calculatedScore >= 68) return 5; // High
  if (calculatedScore >= 51) return 4; // Medium
  if (calculatedScore >= 34) return 3; // Low-Medium
  if (calculatedScore >= 17) return 2; // Low
  return 1; // Very Low
}

/**
 * Get priority configuration based on creation type and priority level
 */
export function getPriorityConfig(
  priority: number,
  creationType?: "manual" | "automatic"
) {
  if (creationType === "automatic") {
    return (
      AUTO_PRIORITY_CONFIG[priority as keyof typeof AUTO_PRIORITY_CONFIG] ||
      AUTO_PRIORITY_CONFIG[1]
    );
  } else {
    // Manual tasks use 4-level system
    return (
      MANUAL_PRIORITY_CONFIG[priority as keyof typeof MANUAL_PRIORITY_CONFIG] ||
      MANUAL_PRIORITY_CONFIG[1]
    );
  }
}

// Legacy export for backward compatibility
export const PRIORITY_CONFIG = MANUAL_PRIORITY_CONFIG;

/**
 * PriorityIndicator component displays priority with color-coded visual indicators
 */
export default function PriorityIndicator({
  priority,
  className,
  showTooltip = true,
  creationType = "manual",
  calculatedScore,
}: PriorityIndicatorProps) {
  const config = getPriorityConfig(priority, creationType);

  const tooltipContent = showTooltip
    ? creationType === "automatic"
      ? `Priority ${priority} (${config.label}) - Score: ${
          calculatedScore || "N/A"
        }`
      : `Priority ${priority} (${config.label})`
    : undefined;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border",
        config.bgColor,
        config.textColor,
        config.borderColor,
        showTooltip && "cursor-help",
        className
      )}
      title={tooltipContent}
    >
      {/* Priority level dot indicator */}
      <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />

      {/* Priority label */}
      <span
        className={cn(
          "font-semibold",
          creationType === "automatic" &&
            config.label === "Critical" &&
            "font-bold"
        )}
      >
        {config.label}
      </span>

      {/* Show calculated score for automatic tasks */}
      {creationType === "automatic" && calculatedScore && (
        <span className="text-xs opacity-75">({calculatedScore})</span>
      )}
    </div>
  );
}

/**
 * Compact version for table cells
 */
export function PriorityIndicatorCompact({
  priority,
  className,
  creationType = "manual",
  calculatedScore,
  showTooltip = false,
}: PriorityIndicatorProps) {
  return (
    <PriorityIndicator
      priority={priority}
      className={cn("px-2 py-1 text-xs sm:px-3 sm:py-1", className)}
      showTooltip={showTooltip}
      creationType={creationType}
      calculatedScore={calculatedScore}
    />
  );
}

/**
 * Get priority label from priority number
 */
export function getPriorityLabel(
  priority: number,
  creationType?: "manual" | "automatic"
): string {
  const config = getPriorityConfig(priority, creationType);
  return config.label;
}
