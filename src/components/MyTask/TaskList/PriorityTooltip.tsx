"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { ActivityWithRelations } from "../Services/Types";
import { getPriorityLabelByScore } from "./PriorityIndicator";
import { getTaskPriorityDisplayData } from "./utils";

interface PriorityTooltipProps {
  task: ActivityWithRelations;
  children: React.ReactNode;
  className?: string;
}

export default function PriorityTooltip({
  task,
  children,
  className,
}: PriorityTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const priorityData = getTaskPriorityDisplayData(task);
  const scorePriorityLabel = getPriorityLabelByScore(
    priorityData.calculatedScore
  );

  return (
    <div
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div className="absolute z-50 px-4 py-3 mt-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg min-w-max max-w-xs left-1/2 transform -translate-x-1/2">
          {/* Tooltip arrow */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />

          <div className="space-y-2">
            <div className="font-semibold text-center border-b border-gray-700 pb-2">
              Priority Calculation
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-300 mb-1">Engagement Score:</div>
                <div className="font-medium">
                  {priorityData.engagementScore}/10
                </div>
              </div>

              <div>
                <div className="text-gray-300 mb-1">Event Importance:</div>
                <div className="font-medium">
                  {priorityData.eventImportance}/10
                </div>
              </div>
            </div>

            <div className="flex flex-row justify-around items-center border-t border-gray-700 pt-2 ">
              <div className="text-center">
                <div className="text-gray-300 text-xs mb-1">Calculation:</div>
                <div className="font-medium">
                  {priorityData.engagementScore} ×{" "}
                  {priorityData.eventImportance} ={" "}
                  {priorityData.calculatedScore}
                </div>
              </div>

              <div className="text-center">
                <div className="text-gray-300 text-xs mb-1">
                  Priority by Score:
                </div>
                <div className="font-semibold text-blue-300">
                  {scorePriorityLabel} ({priorityData.calculatedScore})
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
