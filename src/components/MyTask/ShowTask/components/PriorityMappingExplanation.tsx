import { Info } from "lucide-react";
import { getPriorityLabel } from "../../Services/Types";
import { getScoreRange } from "../utils";

interface PriorityMappingExplanationProps {
  calculatedScore: number;
  calculatedPriority: number;
}

export default function PriorityMappingExplanation({
  calculatedScore,
  calculatedPriority,
}: PriorityMappingExplanationProps) {
  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="w-full">
          <h4 className="font-semibold text-blue-800 mb-2">
            Priority Mapping Explanation
          </h4>
          <p className="text-sm text-blue-700">
            Score {calculatedScore} falls in the{" "}
            {getScoreRange(calculatedScore)}, which maps to Priority{" "}
            {calculatedPriority} ({getPriorityLabel(calculatedPriority)}).
          </p>
        </div>
      </div>
    </div>
  );
}
