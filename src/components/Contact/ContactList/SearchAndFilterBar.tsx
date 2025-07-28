"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, Filter, Loader2, Search, X, Eraser } from "lucide-react";
import { FilterState } from "./Types";
import FilterSelect from "../FilterSelect";

import {
  companySizeOptions,
  employmentStatusOptions,
  locationPreferenceOptions,
  relationshipOptions,
  urgencyOptions,
  engagementScoreOptions,
} from "../Common/constants";

interface SearchAndFilterBarProps {
  searchInputValue: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  clearFilter: () => void;
}

export function SearchAndFilterBar({
  searchInputValue,
  onSearchChange,
  isSearching,
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
  clearFilter,
}: SearchAndFilterBarProps) {
  const createFilterHandler =
    (filterKey: keyof FilterState) => (value: string) => {
      onFiltersChange({
        ...filters,
        [filterKey]: value ? [value] : [],
      });
    };

  const handleEngagementScoreChange = (value: string) => {
    onFiltersChange({
      ...filters,
      engagement_score: value ? [value] : [],
    });
  };

  const handleEngagementRangeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      engagement_range: value ? [value] : [],
    });
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.contact_type.length > 0) count++;
    if (filters.location_category.length > 0) count++;
    if (filters.functional_role.length > 0) count++;
    if (filters.is_active_looking !== null) count++;
    if (filters.current_company_size.length > 0) count++;
    if (filters.past_company_sizes.length > 0) count++;
    if (filters.urgency_level.length > 0) count++;
    if (filters.employment_status.length > 0) count++;
    if (filters.engagement_score.length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchInputValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <button
          onClick={onToggleFilters}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white text-indigo-600 rounded-full px-2 py-0.5 text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>
      </div>
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <button
              onClick={onToggleFilters}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors flex float-right"
              aria-label="Close filters"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FilterSelect
                selected={filters.contact_type[0] || ""}
                onChange={createFilterHandler("contact_type")}
                options={relationshipOptions}
                placeholder="Select contact type"
                label="Contact Type"
              />

              <FilterSelect
                selected={filters.location_category[0] || ""}
                onChange={createFilterHandler("location_category")}
                options={locationPreferenceOptions}
                placeholder="Select location preference"
                label="Location Preference"
              />
              <FilterSelect
                selected={filters.current_company_size[0] || ""}
                onChange={createFilterHandler("current_company_size")}
                options={companySizeOptions}
                placeholder="Select Company Size"
                label="Current Company Size"
              />
              <FilterSelect
                selected={filters.past_company_sizes[0] || ""}
                onChange={createFilterHandler("past_company_sizes")}
                options={companySizeOptions}
                placeholder="Select Company Size"
                label="Past Company Size"
              />
              <FilterSelect
                selected={filters.urgency_level[0] || ""}
                onChange={createFilterHandler("urgency_level")}
                options={urgencyOptions}
                placeholder="Select Urgency Level"
                label="Level of Urgency"
              />
              <FilterSelect
                selected={filters.employment_status[0] || ""}
                onChange={createFilterHandler("employment_status")}
                options={employmentStatusOptions}
                placeholder="Select Employment Status"
                label="Employment Status"
              />
              <FilterSelect
                selected={filters.engagement_score[0] || ""}
                onChange={handleEngagementScoreChange}
                options={engagementScoreOptions.map((opt) => ({
                  value: opt.value.toString(),
                  label: opt.label,
                }))}
                placeholder="Select Engagement Score"
                label="Engagement Score"
              />
            </div>
            <div className="flex justify-end mb-4">
              <button
                onClick={clearFilter}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 justify-end"
              >
                <Eraser className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
