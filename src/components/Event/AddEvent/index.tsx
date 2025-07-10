"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AddEventForm } from "../Common/AddEventForm";
import { useEventData } from "../Services/useEventData";

function AddEvent() {
  const { contact, organizations, isLoading } = useEventData();

  if (isLoading) {
    return (
      <div className="p-4 bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      <AddEventForm
        contact={contact}
        organizations={organizations}
        isLoading={isLoading}
      />
    </div>
  );
}

export default AddEvent;
