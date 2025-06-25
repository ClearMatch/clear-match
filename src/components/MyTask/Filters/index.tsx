"use client";
import { Input } from "@/components/ui/input";
import { ChevronDown, Filter, Search } from "lucide-react";

interface Props {
  onSearch: (term: string) => void;
  searchTerm: string;
}

function Filters({ onSearch, searchTerm }: Props) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search candidates..."
          className="pl-10"
          onChange={(e) => onSearch(e.target.value)}
          value={searchTerm}
          autoComplete="off"
        />
      </div>
      <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        <Filter className="h-4 w-4 mr-2" />
        Filters
        <ChevronDown className="h-4 w-4 ml-2" />
      </button>
    </div>
  );
}

export default Filters;
