"use client";

import { formatDate } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  Edit3,
  FileVideo,
  Gift,
  Loader,
  TrendingDown,
  User,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchEventById } from "../Services/eventService";

function ShowEvent() {
  const params = useParams();
  const selectId = params?.id as string;
  const router = useRouter();

  const { data, error, isLoading } = useQuery({
    queryKey: ["events", selectId],
    queryFn: () => fetchEventById(selectId),
    enabled: !!selectId,
  });

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
        <p className="text-red-500">Error loading event data.</p>
      </div>
    );
  }

  const eventTypeConfig = {
    none: {
      icon: <Ban className="w-6 h-6" />,
      color: "bg-gray-500",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-600",
      label: "None",
    },
    "job-group-posting": {
      icon: <Users className="w-6 h-6" />,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      label: "Job Group Posting",
    },
    layoff: {
      icon: <TrendingDown className="w-6 h-6" />,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-600",
      label: "Layoff",
    },
    birthday: {
      icon: <Gift className="w-6 h-6" />,
      color: "bg-pink-500",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      textColor: "text-pink-600",
      label: "Birthday",
    },
    "funding-event": {
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      label: "Funding Event",
    },
    "new-job": {
      icon: <Briefcase className="w-6 h-6" />,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      label: "New Job",
    },
  };

  const getEventTypeConfig = (type: string = "none") => {
    return (
      eventTypeConfig[type as keyof typeof eventTypeConfig] ||
      eventTypeConfig.none
    );
  };

  const currentEventConfig = getEventTypeConfig(data?.type);

  return (
    data && (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full">
          <div className="mb-6">
            <button
              onClick={() => router.push("/event")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Events</span>
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${currentEventConfig.color} text-white shadow-lg`}
                >
                  {currentEventConfig.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    {currentEventConfig.label}
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Event Details & Information
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/event/edit/${data.id}`)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
              >
                <Edit3 className="w-4 h-4" />
                Edit Event
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Information Card */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800">
                  Event Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      Event ID
                    </label>
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <code className="text-sm text-slate-700 font-mono break-all">
                        {data.id}
                      </code>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      Event Type
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentEventConfig.bgColor} ${currentEventConfig.borderColor} border`}
                      >
                        <div className={`${currentEventConfig.textColor}`}>
                          {currentEventConfig.icon}
                        </div>
                        <span
                          className={`text-sm font-medium ${currentEventConfig.textColor}`}
                        >
                          {currentEventConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      Created At
                    </label>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">
                        {formatDate(data.created_at)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      Last Updated
                    </label>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">
                        {formatDate(data.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Building className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-slate-800">
                  Organization
                </h2>
              </div>

              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                    <Building className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-center text-lg">
                    {data.organizations.name}
                  </h3>
                  <p className="text-sm text-slate-600 text-center mt-1">
                    ID: {data.organizations.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* People Involved Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Candidate Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-slate-800">
                  Candidate
                </h2>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {data.candidates.first_name} {data.candidates.last_name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      ID: {data.candidates.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Created By Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-semibold text-slate-800">
                  Created By
                </h2>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {data.profiles.first_name} {data.profiles.last_name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      ID: {data.profiles.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export default ShowEvent;
