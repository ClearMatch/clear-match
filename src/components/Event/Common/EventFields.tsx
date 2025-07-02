"use client";

import { useMemo } from "react";
import SelectField from "./SelectField";
import { eventTypes } from "./constants";
import { useEventForm } from "./schema";

function EventFields({
  form,
  candidates,
  organizations,
  isLoading,
}: {
  form: ReturnType<typeof useEventForm>;
  candidates: Array<{ id: string; first_name: string; last_name: string }>;
  organizations: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}) {
  const candidateOptions = useMemo(
    () =>
      candidates.map((candidate) => ({
        value: candidate.id,
        label: `${candidate.first_name} ${candidate.last_name}`,
      })),
    [candidates]
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SelectField
          control={form.control}
          name="contact_id"
          label="Contact"
          placeholder={
            candidates.length ? "Select a contact" : "Loading contacts..."
          }
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
    </>
  );
}

export default EventFields;
