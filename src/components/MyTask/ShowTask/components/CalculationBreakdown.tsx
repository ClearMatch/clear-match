import { TrendingUp } from "lucide-react";
import { getPriorityLabel } from "../../Services/Types";

interface CalculationBreakdownProps {
  engagementScore: number;
  eventImportanceScore: number;
  calculatedScore: number;
  calculatedPriority: number;
}

export default function CalculationBreakdown({
  engagementScore,
  eventImportanceScore,
  calculatedScore,
  calculatedPriority,
}: CalculationBreakdownProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Calculation Breakdown
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Contact Engagement Score</span>
          <span className="font-semibold text-gray-900">
            {engagementScore}/10
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Event Importance Score</span>
          <span className="font-semibold text-gray-900">
            {eventImportanceScore}/10
          </span>
        </div>

        <div className="border-t border-gray-300 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Calculated Score</span>
            <span className="font-bold text-gray-900">
              {engagementScore} × {eventImportanceScore} = {calculatedScore}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600">Maps to Priority</span>
            <span className="font-bold text-indigo-600">
              {calculatedPriority} ({getPriorityLabel(calculatedPriority)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
