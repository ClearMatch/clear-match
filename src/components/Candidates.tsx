"use client";

import { useOpenable } from "@/hooks";
import { supabase } from "@/lib/supabase";
import {
  Briefcase,
  Building,
  ChevronDown,
  Filter,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Tags,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import CreateCandidate from "./CreateCandidate";

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  personal_email: string;
  work_email: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  current_job_title: string;
  current_company: string;
  current_location: string;
  relationship_type: string;
  functional_role: string;
  is_active_looking: boolean;
  tech_stack: string[];
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
}

interface FilterState {
  relationship_type: string[];
  functional_role: string[];
  is_active_looking: boolean | null;
  location_category: string[];
}

export function Candidates() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refetchCandidate, setRefetchCandidate] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    relationship_type: [],
    functional_role: [],
    is_active_looking: null,
    location_category: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const { isOpen, onOpen, onClose } = useOpenable();
  useEffect(() => {
    fetchCandidates();
  }, [user, searchQuery, filters, refetchCandidate]);

  async function fetchCandidates() {
    if (!user) return;

    try {
      let query = supabase.from("candidates").select(`
          *,
          tags:candidate_tags (
            tags (
              id,
              name,
              color
            )
          )
        `);

      // Apply search
      if (searchQuery) {
        query = query.or(`
          first_name.ilike.%${searchQuery}%,
          last_name.ilike.%${searchQuery}%,
          current_company.ilike.%${searchQuery}%,
          current_job_title.ilike.%${searchQuery}%
        `);
      }

      // Apply filters
      if (filters.relationship_type.length > 0) {
        query = query.in("relationship_type", filters.relationship_type);
      }
      if (filters.functional_role.length > 0) {
        query = query.in("functional_role", filters.functional_role);
      }
      if (filters.is_active_looking !== null) {
        query = query.eq("is_active_looking", filters.is_active_looking);
      }
      if (filters.location_category.length > 0) {
        query = query.containedBy(
          "current_location->category",
          filters.location_category
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <button
          onClick={onOpen}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Relationship Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Type
              </label>
              <select
                multiple
                value={filters.relationship_type}
                onChange={(e) =>
                  setFilters({
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

            {/* More filters... */}
          </div>
        </div>
      )}

      {/* Candidates List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : candidates.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No candidates found
            </div>
          ) : (
            candidates.map((candidate) => (
              <li key={candidate.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {candidate.first_name} {candidate.last_name}
                        </p>
                        {candidate?.is_active_looking && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Briefcase className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p>
                          {candidate.current_job_title} at{" "}
                          {candidate.current_company}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col">
                      {candidate?.phone && (
                        <div className="flex items-center space-x-2 mb-4">
                          <Phone className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                          <span className="text-sm text-gray-500">
                            {candidate.phone}
                          </span>
                        </div>
                      )}
                      {candidate?.work_email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                          <a
                            href={`mailto:${candidate.work_email}`}
                            className="text-sm text-gray-500 hover:text-gray-600"
                          >
                            {candidate.work_email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="flex-shrink-0 h-4 w-4 text-gray-400" />
                      <span>{candidate?.current_location}</span>
                      <Building className="flex-shrink-0 h-4 w-4 text-gray-400 ml-4" />
                      <span>{candidate?.functional_role}</span>
                      {candidate?.tech_stack &&
                        candidate?.tech_stack.length > 0 && (
                          <>
                            <Tags className="flex-shrink-0 h-4 w-4 text-gray-400 ml-4" />
                            <span>{candidate?.tech_stack.join(", ")}</span>
                          </>
                        )}
                    </div>
                  </div>
                  {candidate.tags && candidate.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {candidate?.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      <CreateCandidate
        isOpen={isOpen}
        onClose={onClose}
        setRefetchCandidate={setRefetchCandidate}
      />
    </div>
  );
}
