"use client";

import { AlertCircle, Loader, User } from "lucide-react";
import { useEffect, useState } from "react";
import ContactActionLinks from "./components/ContactActionLinks";
import ContactInfo from "./components/ContactInfo";
import EngagementLevel from "./components/EngagementLevel";
import RecentActivityList from "./components/RecentActivityList";
import { Contact, RecentActivity } from "./interfaces";
import { fetchContact, fetchRecentActivities } from "./services/dataService";
import { getEngagementLevel } from "./utils";

interface ContactContextProps {
  contactId: string | null | undefined;
  currentTaskId?: string;
}

export default function ContactContext({
  contactId,
  currentTaskId,
}: ContactContextProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contactId) return;

    const fetchContactData = async () => {
      setLoading(true);
      setError(null);

      try {
        const contactData = await fetchContact(contactId);
        setContact(contactData);

        const activitiesData = await fetchRecentActivities(
          contactId,
          currentTaskId
        );
        setRecentActivities(activitiesData);
      } catch (err) {
        console.error("Error fetching contact data:", err);
        setError("Failed to load contact information");
      } finally {
        setLoading(false);
      }
    };

    fetchContactData();
  }, [contactId, currentTaskId]);

  if (!contactId) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          Contact Context
        </h2>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No contact linked to this task</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          Contact Context
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          Contact Context
        </h2>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-500">
            {error || "Failed to load contact information"}
          </p>
        </div>
      </div>
    );
  }

  const engagement = getEngagementLevel(recentActivities);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <User className="w-5 h-5 text-indigo-600" />
        Contact Context
      </h2>

      <div className="space-y-6">
        <ContactInfo contact={contact} />

        <EngagementLevel engagement={engagement} />

        <RecentActivityList recentActivities={recentActivities} />

        <ContactActionLinks contactId={contactId} />
      </div>
    </div>
  );
}
