"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import React from "react";
import { PRIORITY_CONFIG } from "../TaskList/PriorityIndicator";

export interface PriorityRange {
  id: string;
  label: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  textColor: string;
}

export const PRIORITY_RANGES: PriorityRange[] = [
  {
    id: "critical",
    label: "Critical (85-100)",
    min: 85,
    max: 100,
    color: PRIORITY_CONFIG.critical.dotColor,
    bgColor: PRIORITY_CONFIG.critical.bgColor,
    textColor: PRIORITY_CONFIG.critical.textColor,
  },
  {
    id: "high",
    label: "High (68-84)",
    min: 68,
    max: 84,
    color: PRIORITY_CONFIG.high.dotColor,
    bgColor: PRIORITY_CONFIG.high.bgColor,
    textColor: PRIORITY_CONFIG.high.textColor,
  },
  {
    id: "medium",
    label: "Medium (51-67)",
    min: 51,
    max: 67,
    color: PRIORITY_CONFIG.medium.dotColor,
    bgColor: PRIORITY_CONFIG.medium.bgColor,
    textColor: PRIORITY_CONFIG.medium.textColor,
  },
  {
    id: "low",
    label: "Low (34-50)",
    min: 34,
    max: 50,
    color: PRIORITY_CONFIG.low.dotColor,
    bgColor: PRIORITY_CONFIG.low.bgColor,
    textColor: PRIORITY_CONFIG.low.textColor,
  },
  {
    id: "veryLow",
    label: "Very Low (17-33)",
    min: 17,
    max: 33,
    color: PRIORITY_CONFIG.veryLow.dotColor,
    bgColor: PRIORITY_CONFIG.veryLow.bgColor,
    textColor: PRIORITY_CONFIG.veryLow.textColor,
  },
  {
    id: "extremelyLow",
    label: "Extremely Low (1-16)",
    min: 1,
    max: 16,
    color: PRIORITY_CONFIG.extremelyLow.dotColor,
    bgColor: PRIORITY_CONFIG.extremelyLow.bgColor,
    textColor: PRIORITY_CONFIG.extremelyLow.textColor,
  },
];

interface PriorityRangeFilterProps {
  selectedRanges: string[];
  onChange: (ranges: string[]) => void;
  className?: string;
}

export default function PriorityRangeFilter({
  selectedRanges,
  onChange,
  className,
}: PriorityRangeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleRangeToggle = (rangeId: string) => {
    const isSelected = selectedRanges.includes(rangeId);

    if (isSelected) {
      onChange(selectedRanges.filter((id) => id !== rangeId));
    } else {
      onChange([...selectedRanges, rangeId]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const getSelectedRangeLabels = () => {
    return PRIORITY_RANGES.filter((range) => selectedRanges.includes(range.id))
      .map((range) => range.label.split(" ")[0]) // Get just "Critical", "High", etc.
      .join(", ");
  };

  const selectedCount = selectedRanges.length;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
          isOpen && "bg-gray-50 border-indigo-500 ring-2 ring-indigo-500",
          selectedCount > 0 && "border-indigo-400 bg-indigo-50"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedCount > 0 ? (
            <span className="text-indigo-700 font-medium truncate">
              {selectedCount === 1
                ? getSelectedRangeLabels()
                : `${selectedCount} ranges selected`}
            </span>
          ) : (
            <span className="text-gray-500">Select priority range</span>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {selectedCount > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="p-1 hover:bg-indigo-100 rounded-full transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3 text-indigo-600" />
            </div>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isOpen && "transform rotate-180"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 z-20 mt-1 w-full min-w-[280px] bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                Filter by Priority Score Range
              </div>

              <div className="space-y-1">
                {PRIORITY_RANGES.map((range) => {
                  const isSelected = selectedRanges.includes(range.id);

                  return (
                    <div
                      key={range.id}
                      onClick={() => handleRangeToggle(range.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors text-left cursor-pointer",
                        isSelected
                          ? "bg-indigo-50 text-indigo-700"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      {/* Checkbox */}
                      <div
                        className={cn(
                          "w-4 h-4 border rounded flex items-center justify-center flex-shrink-0",
                          isSelected
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-gray-300"
                        )}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Priority color indicator */}
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full flex-shrink-0",
                          range.color
                        )}
                      />

                      {/* Range label */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {range.label.split(" ")[0]}
                        </div>
                        <div className="text-xs text-gray-500">
                          Score {range.min}-{range.max}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedCount > 0 && (
                <div className="border-t mt-2 pt-2">
                  <div
                    onClick={clearAll}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 py-1 transition-colors cursor-pointer text-center"
                  >
                    Clear all ({selectedCount})
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
