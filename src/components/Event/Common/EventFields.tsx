"use client";

import { memo, useMemo } from "react";
import SelectField from "./SelectField";
import { eventTypes } from "./constants";
import { useEventForm } from "./schema";

interface EventFieldsProps {
  form: ReturnType<typeof useEventForm>;
  contact: Array<{ id: string; first_name: string; last_name: string }>;
  organizations: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

const EventFields = memo(function EventFields({
  form,
  contact,
  organizations,
  isLoading,
}: EventFieldsProps) {
  const candidateOptions = useMemo(
    () =>
      contact.map((contact) => ({
        value: contact.id,
        label: `${contact.first_name} ${contact.last_name}`,
      })),
    [contact]
  );

  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.name,
      })),
    [organizations]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SelectField
        control={form.control}
        name="contact_id"
        label="Contact"
        placeholder="Select a contact"
        options={candidateOptions}
        disabled={isLoading}
        required
      />

      <SelectField
        control={form.control}
        name="organization_id"
        label="Organization"
        placeholder="Select an organization"
        options={organizationOptions}
        disabled={isLoading}
      />
      <SelectField
        control={form.control}
        name="type"
        label="Event Type"
        placeholder="Select event type"
        options={eventTypes}
        disabled={isLoading}
        required
      />
    </div>
  );
});

export default EventFields;
