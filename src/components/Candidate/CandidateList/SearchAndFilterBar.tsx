"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, Filter, Loader2, Search } from "lucide-react";
import { FilterState } from "./Types";

interface SearchAndFilterBarProps {
  searchInputValue: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function SearchAndFilterBar({
  searchInputValue,
  onSearchChange,
  isSearching,
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
}: SearchAndFilterBarProps) {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search candidates..."
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
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>
      </div>
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship Type
                </label>
                <select
                  multiple
                  value={filters.relationship_type}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      relationship_type: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    })
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="candidate">Candidate</option>
                  <option value="client">Client</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
