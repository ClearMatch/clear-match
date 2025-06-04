"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOpenable } from "@/hooks";
import { supabase } from "@/lib/supabase";
import {
  Briefcase,
  Building,
  ChevronDown,
  Edit,
  Filter,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import CreateCandidate from "./Candidate/CreateCandidate";
import DeleteCandidate from "./Candidate/DeleteCandidate";
import EditCandidate from "./Candidate/EditCandidate";

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

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function Candidates() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectId, setSelectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInputValue, setSearchInputValue] = useState("");
  const debouncedSearchQuery = useDebounce(searchInputValue, 500); // 500ms debounce
  const [refetchCandidate, setRefetchCandidate] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    relationship_type: [],
    functional_role: [],
    is_active_looking: null,
    location_category: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const { isOpen, onOpen, onClose } = useOpenable();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useOpenable();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useOpenable();

  const fetchCandidates = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from("candidates")
        .select(
          `
          *,
          tags:candidate_tags (
            tags (
              id,
              name,
              color
            )
          )
        `
        )
        .order("updated_at", { ascending: false });

      // Apply search - Fixed search query format
      if (debouncedSearchQuery) {
        query = query.or(
          `first_name.ilike.%${debouncedSearchQuery}%,last_name.ilike.%${debouncedSearchQuery}%,current_company.ilike.%${debouncedSearchQuery}%,current_job_title.ilike.%${debouncedSearchQuery}%`
        );
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
  }, [user, debouncedSearchQuery, filters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates, refetchCandidate]);

  const handleEditClick = (e: React.MouseEvent, candidateId: string) => {
    e.stopPropagation();
    setSelectId(candidateId);
    onEditOpen();
    setRefetchCandidate(false);
  };
  const handleDeleteClick = (e: React.MouseEvent, candidateId: string) => {
    e.stopPropagation();
    setSelectId(candidateId);
    onDeleteOpen();
    setRefetchCandidate(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <button
          onClick={() => {
            setRefetchCandidate(false);
            onOpen();
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search candidates..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className="pl-10"
          />
          {debouncedSearchQuery !== searchInputValue && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      )}

      {/* Candidates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            No candidates found
          </div>
        ) : (
          candidates.map((candidate) => (
            <Card
              key={candidate.id}
              className="overflow-hidden hover:shadow-md transition-shadow duration-200"
              onClick={() => {
                setSelectId(candidate.id);
                setRefetchCandidate(false);
              }}
            >
              <CardContent className="p-5 pr-12 cursor-pointer relative">
                <button
                  className="absolute top-6 right-4 z-10"
                  onClick={(e) => handleEditClick(e, candidate.id)}
                >
                  <Edit className="h-4 w-4" color="blue" />
                  <span className="sr-only">Edit</span>
                </button>
                <button
                  className="absolute top-11 right-4 z-10 mt-2"
                  onClick={(e) => handleDeleteClick(e, candidate.id)}
                >
                  <Trash2 className="h-4 w-4" color="red" />
                  <span className="sr-only">Delete</span>
                </button>

                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-indigo-600">
                        {candidate.first_name} {candidate.last_name}
                      </h3>
                      {candidate?.is_active_looking && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-green-50 text-green-700 border-green-200"
                        >
                          Active
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Briefcase className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <p>
                        {candidate.current_job_title} at{" "}
                        {candidate.current_company}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="flex-shrink-0 h-4 w-4 text-gray-400" />
                      <span>{candidate?.current_location}</span>
                    </div>

                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                      <Building className="flex-shrink-0 h-4 w-4 text-gray-400" />
                      <span>{candidate?.functional_role}</span>
                    </div>

                    {candidate?.tech_stack &&
                      candidate?.tech_stack.length > 0 && (
                        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                          <Tags className="flex-shrink-0 h-4 w-4 text-gray-400" />
                          <span>{candidate?.tech_stack.join(", ")}</span>
                        </div>
                      )}
                  </div>

                  <div className="md:ml-4 mt-4 md:mt-0 flex flex-col space-y-2 md:items-end">
                    {candidate?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {candidate.phone}
                        </span>
                      </div>
                    )}
                    {candidate?.work_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a
                          href={`mailto:${candidate.work_email}`}
                          className="text-sm text-gray-500 hover:text-indigo-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {candidate.work_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {candidate.tags && candidate.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {candidate?.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          borderColor: `${tag.color}40`,
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateCandidate
        isOpen={isOpen}
        onClose={onClose}
        setRefetchCandidate={setRefetchCandidate}
      />
      <EditCandidate
        selectId={selectId}
        isOpen={isEditOpen}
        onClose={onEditClose}
        setRefetchCandidate={setRefetchCandidate}
      />
      <DeleteCandidate
        selectId={selectId}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        setRefetchCandidate={setRefetchCandidate}
      />
    </div>
  );
}
