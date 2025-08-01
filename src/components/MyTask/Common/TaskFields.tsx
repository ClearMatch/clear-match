"use client";

import TextInputField from "@/components/Contact/Common/TextInputField";
import { useMemo } from "react";
import {
  activityTypeOptions,
  priorityOptions,
  statusOptions,
} from "./constants";
import DateField from "./DateField";
import { useTaskForm } from "./schema";
import SelectField from "./SelectField";
import TextAreaField from "./TextAreaField";

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

interface Event {
  id: string;
  name: string;
}

interface JobPosting {
  id: string;
  title: string;
}

function TaskFields({
  form,
  contacts,
  organizations,
  users = [],
  events = [],
  isLoading,
}: {
  form: ReturnType<typeof useTaskForm>;
  contacts: Array<{ id: string; first_name: string; last_name: string }>;
  organizations: Array<{ id: string; name: string }>;
  users?: Array<User>;
  events?: Array<Event>;
  isLoading?: boolean;
}) {
  const contactOptions = useMemo(
    () =>
      contacts.map((contact) => ({
        value: contact.id,
        label: `${contact.first_name} ${contact.last_name}`,
      })),
    [contacts]
  );

  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.name,
      })),
    [organizations]
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: `${user.first_name} ${user.last_name}`,
      })),
    [users]
  );

  const eventOptions = useMemo(
    () =>
      events.map((event) => ({
        value: event.id,
        label: event.name,
      })),
    [events]
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SelectField
          control={form.control}
          name="contact_id"
          label="Contact"
          placeholder={
            contacts.length ? "Select a contact" : "Loading contacts..."
          }
          options={contactOptions}
          disabled={isLoading}
          required
        />
        <SelectField
          control={form.control}
          name="organization_id"
          label="Organization"
          placeholder="Select an organization"
          options={organizationOptions}
        />
        <SelectField
          control={form.control}
          name="type"
          label="Task Type"
          placeholder="Select Task type"
          options={activityTypeOptions}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TextInputField
          control={form.control}
          name="subject"
          label="Subject"
          placeholder="Enter subject"
        />
        <SelectField
          control={form.control}
          name="status"
          label="Status"
          placeholder="Select status"
          options={statusOptions}
        />
        <SelectField
          control={form.control}
          name="priority"
          label="Priority"
          placeholder="Select priority"
          options={priorityOptions}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DateField
          control={form.control}
          name="due_date"
          label="Due Date"
          placeholder="Select due date"
          required
        />
        <SelectField
          control={form.control}
          name="event_id"
          label="Event"
          placeholder="Select event"
          options={eventOptions}
        />
        <SelectField
          control={form.control}
          name="assigned_to"
          label="Assigned To"
          placeholder="Assigned To"
          options={userOptions}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextAreaField
          control={form.control}
          name="description"
          label="Description"
          placeholder="Enter activity description"
          rows={4}
          required
        />

        <TextAreaField
          control={form.control}
          name="content"
          label="Content"
          placeholder="Enter activity content"
          rows={4}
        />
      </div>
    </>
  );
}

export default TaskFields;
