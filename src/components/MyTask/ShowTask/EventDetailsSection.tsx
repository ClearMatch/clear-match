"use client";

import { formatDate } from "@/lib/utils";
import { AlertCircle, Calendar, ExternalLink, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "./constants";
import { Event } from "./interfaces";
import { fetchEvent } from "./services/dataService";

interface EventDetailsSectionProps {
  eventId: string | null | undefined;
}

export default function EventDetailsSection({
  eventId,
}: EventDetailsSectionProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchEvent(eventId);
        setEvent(data);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  if (!eventId) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Event Details
        </h2>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No event linked to this task</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Event Details
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Event Details
        </h2>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-500">
            {error || "Failed to load event details"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-indigo-600" />
        Event Details
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Event Type</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${
              EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.none
            }`}
          >
            {EVENT_TYPE_LABELS[event.type] || event.type}
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Created Date</span>
          <span className="text-gray-900 font-semibold">
            {formatDate(event.created_at)}
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Last Updated</span>
          <span className="text-gray-900 font-semibold">
            {formatDate(event.updated_at)}
          </span>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            <ExternalLink className="w-4 h-4" />
            View Full Event Details
          </button>
        </div>
      </div>
    </div>
  );
}
