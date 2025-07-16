"use client";

import { AlertCircle, Calculator, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  calculateTaskPriorityForForm,
  PriorityCalculationResult,
} from "../Common/priorityCalculation";

interface PriorityCalculationBreakdownProps {
  priority: number;
  eventId?: string | null | undefined;
  contactId?: string | null | undefined;
  activityType?: string;
}

export default function PriorityCalculationBreakdown({
  priority,
  eventId,
  contactId,
  activityType = "email", // Default to email if not provided
}: PriorityCalculationBreakdownProps) {
  const [calculationResult, setCalculationResult] =
    useState<PriorityCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCalculation() {
      if (!contactId || !activityType) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await calculateTaskPriorityForForm(
          contactId,
          activityType
        );
        setCalculationResult(result);
      } catch (err) {
        console.error("Error calculating priority:", err);
        setError("Failed to calculate priority breakdown");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCalculation();
  }, [contactId, activityType]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-indigo-600" />
        Priority Calculation Breakdown
      </h2>

      {isLoading && (
        <div className="flex items-center gap-2 text-blue-600 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading priority calculation...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 py-4">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && calculationResult && (
        <div className="space-y-6">
          {/* Current Priority */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Current Task Priority
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-indigo-600">
                Priority {priority}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                  priority
                )}`}
              >
                {getPriorityLabel(priority)}
              </span>
            </div>
          </div>

          {/* Calculation Components */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-1">
                Contact Engagement Score
              </h4>
              <div className="text-2xl font-bold text-blue-900">
                {calculationResult.engagementScore}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                From contact&apos;s engagement record
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-1">
                Event Importance Score
              </h4>
              <div className="text-2xl font-bold text-green-900">
                {calculationResult.eventImportance}
              </div>
              <p className="text-xs text-green-600 mt-1">
                For &quot;{activityType}&quot; activity type
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="text-sm font-medium text-purple-800 mb-1">
                Calculated Score
              </h4>
              <div className="text-2xl font-bold text-purple-900">
                {calculationResult.calculatedScore}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {calculationResult.calculation}
              </p>
            </div>
          </div>

          {/* Calculated Priority */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
            <h4 className="text-lg font-semibold text-indigo-800 mb-2">
              Calculated Priority
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-indigo-600">
                Priority {calculationResult.priorityLevel}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getCalculatedPriorityColor(
                  calculationResult.priorityLevel
                )}`}
              >
                {calculationResult.priorityLabel}
              </span>
            </div>
          </div>

          {/* Priority Mapping */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Priority Score Mapping
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>80+ = Critical (4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>60-79 = High (3)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>40-59 = Medium (2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>0-39 = Low (1)</span>
              </div>
            </div>
          </div>

          {/* Comparison
          {calculationResult.priorityLevel !== priority.toString() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Priority Mismatch</h4>
              <p className="text-yellow-700">
                Based on the calculation, this task should have priority <strong>{calculationResult.priorityLevel} ({calculationResult.priorityLabel})</strong>, 
                but it&apos;s currently set to <strong>Priority {priority} ({getPriorityLabel(priority)})</strong>.
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                This may indicate the priority was manually adjusted or calculated using a different system.
              </p>
            </div>
          )} */}
        </div>
      )}
    </div>
  );
}

// Helper functions for priority display
function getPriorityColor(priority: number): string {
  switch (priority) {
    case 4:
      return "bg-red-100 text-red-800 border-red-200";
    case 3:
      return "bg-orange-100 text-orange-800 border-orange-200";
    case 2:
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case 1:
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 4:
      return "Critical";
    case 3:
      return "High";
    case 2:
      return "Medium";
    case 1:
      return "Low";
    default:
      return "Unknown";
  }
}

function getCalculatedPriorityColor(priorityLevel: string): string {
  switch (priorityLevel) {
    case "4":
      return "bg-red-100 text-red-800 border-red-200";
    case "3":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "2":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "1":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
