"use client";

import { AlertCircle, Calculator, Loader2 } from "lucide-react";
import { PriorityCalculationResult } from "./priorityCalculation";

interface PriorityCalculationDisplayProps {
  calculationResult: PriorityCalculationResult | null;
  isCalculating: boolean;
  calculationError: string | null;
  contactId?: string;
  activityType?: string;
}

export function PriorityCalculationDisplay({
  calculationResult,
  isCalculating,
  calculationError,
  contactId,
  activityType,
}: PriorityCalculationDisplayProps) {
  // Don't show anything if no contact or activity type is selected
  if (!contactId || !activityType) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-blue-800">
          Priority Calculation
        </h3>
      </div>

      {isCalculating && (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Calculating priority...</span>
        </div>
      )}

      {calculationError && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{calculationError}</span>
        </div>
      )}

      {calculationResult && !isCalculating && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded p-2">
              <div className="text-gray-600 text-xs">Engagement Score</div>
              <div className="font-semibold text-blue-800">
                {calculationResult.engagementScore}
              </div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-gray-600 text-xs">Event Importance</div>
              <div className="font-semibold text-blue-800">
                {calculationResult.eventImportance}
              </div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-gray-600 text-xs">Calculated Score</div>
              <div className="font-semibold text-blue-800">
                {calculationResult.calculatedScore}
              </div>
            </div>
          </div>

          <div className="bg-white rounded p-2">
            <div className="text-gray-600 text-xs mb-1">Calculation</div>
            <div className="font-mono text-sm text-blue-800">
              {calculationResult.calculation}
            </div>
          </div>

          <div className="bg-white rounded p-2">
            <div className="text-gray-600 text-xs mb-1">Result</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-800">
                Priority {calculationResult.priorityLevel} (
                {calculationResult.priorityLabel})
              </span>
              <div
                className={`w-3 h-3 rounded-full ${getPriorityColor(
                  calculationResult.priorityLevel
                )}`}
              />
            </div>
          </div>

          <div className="text-xs text-gray-600 italic">
            {calculationResult.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get color class for priority level
 */
function getPriorityColor(priorityLevel: string): string {
  switch (priorityLevel) {
    case "4": // Critical
      return "bg-red-500";
    case "3": // High
      return "bg-orange-500";
    case "2": // Medium
      return "bg-yellow-500";
    case "1": // Low
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}
