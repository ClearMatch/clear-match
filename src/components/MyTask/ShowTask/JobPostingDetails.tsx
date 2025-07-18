"use client";

import { formatDate } from "@/lib/utils";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  DollarSign,
  ExternalLink,
  Loader,
} from "lucide-react";
import { useEffect, useState } from "react";
import { JOB_STATUS_COLORS, JOB_STATUS_LABELS } from "./constants";
import { JobPosting } from "./interfaces";
import { fetchJobPosting } from "./services/dataService";
import { formatSalaryRange } from "./utils";

interface JobPostingDetailsProps {
  jobPostingId: string | null | undefined;
}

export default function JobPostingDetails({
  jobPostingId,
}: JobPostingDetailsProps) {
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobPostingId) return;

    const fetchJobPostingData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchJobPosting(jobPostingId);
        setJobPosting(data);
      } catch (err) {
        console.error("Error fetching job posting:", err);
        setError("Failed to load job posting details");
      } finally {
        setLoading(false);
      }
    };

    fetchJobPostingData();
  }, [jobPostingId]);

  if (!jobPostingId) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Job Posting Details
        </h2>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No job posting linked to this task</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Job Posting Details
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error || !jobPosting) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Job Posting Details
        </h2>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-500">
            {error || "Failed to load job posting details"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-indigo-600" />
        Job Posting Details
      </h2>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
          <h3 className="text-lg font-bold text-indigo-900 mb-1">
            {jobPosting.title}
          </h3>
          <p className="text-sm text-indigo-700">Job Title</p>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Status</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${
              JOB_STATUS_COLORS[jobPosting.status] || JOB_STATUS_COLORS.none
            }`}
          >
            {JOB_STATUS_LABELS[jobPosting.status] || jobPosting.status}
          </span>
        </div>

        {jobPosting.posting_date && (
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Posting Date
            </span>
            <span className="text-gray-900 font-semibold">
              {formatDate(jobPosting.posting_date)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Salary Range
          </span>
          <span className="text-gray-900 font-semibold">
            {formatSalaryRange(jobPosting.salary_range)}
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Job Posting ID</span>
          <span className="text-gray-900 font-mono text-sm">
            {jobPosting.id.slice(0, 8)}...
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Created</span>
          <span className="text-gray-900 font-semibold">
            {formatDate(jobPosting.created_at)}
          </span>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            <ExternalLink className="w-4 h-4" />
            View Full Job Posting
          </button>
        </div>
      </div>
    </div>
  );
}
