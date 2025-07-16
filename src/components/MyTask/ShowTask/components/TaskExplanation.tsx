import { Info } from "lucide-react";
import { PriorityInfo } from "../interfaces";

interface TaskExplanationProps {
  priorityInfo: PriorityInfo;
}

export default function TaskExplanation({
  priorityInfo,
}: TaskExplanationProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-gray-800 mb-1">
            Current Task Explanation
          </h4>
          <p className="text-sm text-gray-700">{priorityInfo.description}</p>
        </div>
      </div>
    </div>
  );
}
