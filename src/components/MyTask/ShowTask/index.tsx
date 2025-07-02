"use client";

import { formatDate } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit,
  FileVideo,
  Loader,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { fetchTaskById } from "../Services";
import {
  ActivityWithRelations,
  getFullName,
  getPriorityLabel,
} from "../Services/Types";
import { getPriorityColor, getStatusColor } from "./Types";

function ShowTask() {
  const params = useParams();
  const selectId = params?.id as string;
  const router = useRouter();

  const {
    data: taskData,
    error,
    isLoading,
  } = useSWR<ActivityWithRelations>(
    selectId ? ["activities", selectId] : null,
    () => fetchTaskById(selectId)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error loading task data.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white">
                    <FileVideo className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                      {taskData?.description}
                    </h1>
                    <p className="text-gray-500 font-mono text-sm">
                      ID: {taskData?.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(`/task/edit/${selectId}`)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Task
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                Task Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Subject</span>
                    <span className="text-gray-900 font-semibold">
                      {taskData?.subject}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Content</span>
                    <span className="text-gray-900 font-semibold">
                      {taskData?.content}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Type</span>
                    <span className="text-gray-900 font-semibold capitalize">
                      {taskData?.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        taskData?.status ?? ""
                      )}`}
                    >
                      {taskData?.status.replace("-", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Priority</span>
                    <span
                      className={`px-2 py-1 rounded text-sm font-bold ${getPriorityColor(
                        taskData?.priority || 0
                      )}`}
                    >
                      {getPriorityLabel(taskData?.priority || 0)}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Created</span>
                    <span className="text-gray-900 text-sm">
                      {formatDate(taskData?.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Due Date</span>
                    <span className="text-gray-900 font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(taskData?.due_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                People Involved
              </h2>
              <div className="space-y-4">
                {/* Candidate */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Candidate
                  </h3>
                  <p className="text-blue-700 font-medium">
                    {getFullName(
                      taskData?.candidates?.first_name,
                      taskData?.candidates?.last_name
                    )}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Created By
                  </h3>
                  <p className="text-green-700 font-medium">
                    {getFullName(
                      taskData?.profiles?.first_name,
                      taskData?.profiles?.last_name
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                System Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Organization ID</span>
                  <span className="text-gray-900 text-sm font-mono">
                    {taskData?.organization_id?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Assigned To</span>
                  <span className="text-gray-900 text-sm font-mono">
                    {taskData?.assigned_to?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Job Posting</span>
                  <span className="text-gray-500 text-sm">
                    {taskData?.job_posting_id || "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Event</span>
                  <span className="text-gray-500 text-sm">
                    {taskData?.event_id || "None"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowTask;
