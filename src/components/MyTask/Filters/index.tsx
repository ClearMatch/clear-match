"use client";

import FilterSelect from "@/components/Contact/FilterSelect";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, Eraser, Filter, Loader2, Search, X } from "lucide-react";
import { useCallback } from "react";
import {
  activityTypeOptions,
  priorityOptions,
  statusOptions,
} from "../Common/constants";

export interface TaskFilterState {
  type: string[];
  status: string[];
  priority: string[];
  assigned_to: string[];
  created_by: string[];
}

interface TaskSearchAndFilterBarProps {
  searchInputValue: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;
  filters: TaskFilterState;
  onFiltersChange: (filters: TaskFilterState) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  clearFilter: () => void;
  assigneeOptions?: { value: string; label: string }[];
  creatorOptions?: { value: string; label: string }[];
}

function TaskSearchAndFilterBar({
  searchInputValue,
  onSearchChange,
  isSearching,
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
  clearFilter,
  assigneeOptions = [],
  creatorOptions = [],
}: TaskSearchAndFilterBarProps) {
  const createFilterHandler = useCallback(
    (filterKey: keyof TaskFilterState) => (value: string) => {
      const newFilters = {
        ...filters,
        [filterKey]: value ? [value] : [],
      };

      const currentValue = filters[filterKey][0] || "";
      if (currentValue !== value) {
        onFiltersChange(newFilters);
      }
    },
    [filters, onFiltersChange]
  );

  const hasActiveFilters = Object.values(filters).some(
    (filter) => filter.length > 0
  );

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchInputValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            autoComplete="off"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <button
          onClick={onToggleFilters}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            hasActiveFilters
              ? "bg-indigo-700 hover:bg-indigo-800"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 bg-white text-indigo-600 rounded-full text-xs px-2 py-0.5 font-semibold">
              {
                Object.values(filters).filter((filter) => filter.length > 0)
                  .length
              }
            </span>
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>
      </div>
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                Filter Tasks
              </h3>
              <button
                onClick={onToggleFilters}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close filters"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FilterSelect
                selected={filters.type[0] || ""}
                onChange={createFilterHandler("type")}
                options={activityTypeOptions}
                placeholder="Select task type"
                label="Task Type"
              />

              <FilterSelect
                selected={filters.status[0] || ""}
                onChange={createFilterHandler("status")}
                options={statusOptions}
                placeholder="Select status"
                label="Status"
              />

              <FilterSelect
                selected={filters.priority[0] || ""}
                onChange={createFilterHandler("priority")}
                options={priorityOptions}
                placeholder="Select priority"
                label="Priority Level"
              />

              {assigneeOptions.length > 0 && (
                <FilterSelect
                  selected={filters.assigned_to[0] || ""}
                  onChange={createFilterHandler("assigned_to")}
                  options={assigneeOptions}
                  placeholder="Select assignee"
                  label="Assigned To"
                />
              )}

              {creatorOptions.length > 0 && (
                <FilterSelect
                  selected={filters.created_by[0] || ""}
                  onChange={createFilterHandler("created_by")}
                  options={creatorOptions}
                  placeholder="Select creator"
                  label="Created By"
                />
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="text-sm text-gray-600">
                  {
                    Object.values(filters).filter((filter) => filter.length > 0)
                      .length
                  }{" "}
                  filter(s) active
                </span>
                <button
                  onClick={clearFilter}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Eraser className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default TaskSearchAndFilterBar;
