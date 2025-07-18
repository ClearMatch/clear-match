"use client";

import { Calculator } from "lucide-react";
import CalculationBreakdown from "./components/CalculationBreakdown";
import PriorityMappingExplanation from "./components/PriorityMappingExplanation";
import PriorityScoreDisplay from "./components/PriorityScoreDisplay";
import TaskExplanation from "./components/TaskExplanation";
import { PRIORITY_EXPLANATIONS } from "./constants";
import {
  getEngagementScore,
  getEventImportanceScore,
  getScoreToPriority,
} from "./utils";

interface PriorityCalculationBreakdownProps {
  priority: number;
  eventId?: string | null | undefined;
  contactId?: string | null | undefined;
}

export default function PriorityCalculationBreakdown({
  priority,
  eventId,
  contactId,
}: PriorityCalculationBreakdownProps) {
  const defaultPriorityInfo = {
    calculation:
      "Minimal engagement × Minimal importance = 0-9 (Very Low Priority)",
    description: "Optional task with no immediate urgency",
  };

  const priorityInfo =
    PRIORITY_EXPLANATIONS[priority] ??
    PRIORITY_EXPLANATIONS[6] ??
    defaultPriorityInfo;

  const engagementScore = getEngagementScore(priority, contactId);
  const eventImportanceScore = getEventImportanceScore(priority, eventId);
  const calculatedScore = engagementScore * eventImportanceScore;
  const calculatedPriority = getScoreToPriority(calculatedScore);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-indigo-600" />
        Priority Calculation
      </h2>

      <div className="space-y-6">
        <PriorityScoreDisplay priority={priority} />

        <CalculationBreakdown
          engagementScore={engagementScore}
          eventImportanceScore={eventImportanceScore}
          calculatedScore={calculatedScore}
          calculatedPriority={calculatedPriority}
        />

        <PriorityMappingExplanation
          calculatedScore={calculatedScore}
          calculatedPriority={calculatedPriority}
        />

        <TaskExplanation priorityInfo={priorityInfo} />
      </div>
    </div>
  );
}
