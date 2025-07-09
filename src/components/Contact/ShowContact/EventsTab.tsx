"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import DataTable from "@/components/ui/DataTable";
import { Column } from "@/components/ui/DataTable/Types";
import { formatDate } from "@/lib/utils";
import { Plus, Loader } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddEventForm from "./AddEventForm";
import { fetchEventsByContact, Event } from "./eventsService";

interface EventsTabProps {
  contactId: string;
  contactName?: string;
}

function EventsTab({ contactId, contactName = "Contact" }: EventsTabProps) {
  const [showAddEvent, setShowAddEvent] = useState(false);

  const queryClient = useQueryClient();
  
  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery<Event[]>({
    queryKey: ["contact-events", contactId],
    queryFn: () => fetchEventsByContact(contactId),
    enabled: !!contactId,
  });

  const mutate = () => {
    queryClient.invalidateQueries({ queryKey: ["contact-events", contactId] });
  };

  const handleAddEvent = () => {
    setShowAddEvent(true);
  };

  const handleEventAdded = () => {
    setShowAddEvent(false);
    mutate(); // Refresh the events list
  };

  const eventColumns: Column<Event>[] = [
    {
      key: "type",
      header: "Event Type",
      render: (row) => (
        <span className="text-sm capitalize">
          {row.type.replace("-", " ")}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (row) => (
        <span className="text-sm">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "created_by",
      header: "Created By",
      render: (row) => {
        const { first_name, last_name } = row.profiles || {};
        return (
          <span className="text-sm">
            {first_name && last_name ? `${first_name} ${last_name}` : "Unknown"}
          </span>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="animate-spin h-6 w-6 text-indigo-600" />
        <span className="ml-2 text-sm text-gray-600">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Related Events ({events.length})
        </h3>
        <Button 
          onClick={handleAddEvent} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      {error && (
        <div className="text-center py-4">
          <p className="text-red-500">Error loading events: {error.message}</p>
        </div>
      )}

      {events.length === 0 && !isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No events found for this contact</p>
        </div>
      ) : (
        <DataTable
          columns={eventColumns}
          data={events}
          rowKey="id"
          hideHeaderCheckBox
          hideRowCheckBox
        />
      )}

      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl p-0">
          <AddEventForm
            contactId={contactId}
            contactName={contactName}
            onSuccess={handleEventAdded}
            onCancel={() => setShowAddEvent(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EventsTab;