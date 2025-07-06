"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import {
  Building,
  Edit,
  Loader,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import useSWR from "swr";
import { fetchContactById } from "./contactService";
import TasksTab from "./TasksTab";
import EventsTab from "./EventsTab";

function ShowContact() {
  const params = useParams();
  const contactId = params?.id as string;
  const router = useRouter();

  const {
    data: contact,
    error,
    isLoading,
  } = useSWR(
    contactId ? ["contacts", contactId] : null,
    () => fetchContactById(contactId),
    { errorRetryCount: 3 }
  );

  // Optimize contact name computation
  const contactFullName = useMemo(
    () => contact ? `${contact.first_name} ${contact.last_name}` : '',
    [contact?.first_name, contact?.last_name]
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
        <p className="text-red-500">Error loading contact data.</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Candidate not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Candidate Information Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  {contactFullName}
                </h1>
                <p className="text-gray-500 font-mono text-sm">
                  ID: {contact.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push(`/contacts/edit/${contactId}`)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Contact
              </Button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Current Role</p>
                <p className="font-medium text-gray-900">
                  {contact.current_job_title || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium text-gray-900">
                  {contact.current_company || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900">
                  {typeof contact.current_location === "string"
                    ? contact.current_location
                    : contact.current_location?.location || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Personal Email</p>
                <p className="font-medium text-gray-900">
                  {contact.personal_email || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Work Email</p>
                <p className="font-medium text-gray-900">
                  {contact.work_email || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">
                  {contact.phone || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Relationship:</span>
                <span className="ml-2 font-medium capitalize">
                  {contact.contact_type}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Functional Role:</span>
                <span className="ml-2 font-medium">
                  {contact.functional_role}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Active Looking:</span>
                <span className="ml-2 font-medium">
                  {contact.is_active_looking ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks">
              <TasksTab 
                contactId={contactId} 
                contactName={contactFullName}
              />
            </TabsContent>
            <TabsContent value="events">
              <EventsTab 
                contactId={contactId} 
                contactName={contactFullName}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default ShowContact;