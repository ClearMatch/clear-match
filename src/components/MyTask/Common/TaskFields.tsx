"use client";

import TextInputField from "@/components/Candidate/Common/TextInputField";
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
  candidates,
  organizations,
  users = [],
  events = [],
  jobPostings = [],
  isLoading,
}: {
  form: ReturnType<typeof useTaskForm>;
  candidates: Array<{ id: string; first_name: string; last_name: string }>;
  organizations: Array<{ id: string; name: string }>;
  users?: Array<User>;
  events?: Array<Event>;
  jobPostings?: Array<JobPosting>;
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

  const jobPostingOptions = useMemo(
    () =>
      jobPostings.map((jobPosting) => ({
        value: jobPosting.id,
        label: jobPosting.title,
      })),
    [jobPostings]
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SelectField
          control={form.control}
          name="candidate_id"
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
        />
        <SelectField
          control={form.control}
          name="type"
          label="Activity Type"
          placeholder="Select activity type"
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
        />
        <SelectField
          control={form.control}
          name="assigned_to"
          label="Assigned To"
          placeholder="Select assignee"
          options={userOptions}
        />
        <SelectField
          control={form.control}
          name="event_id"
          label="Event"
          placeholder="Select event"
          options={eventOptions}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SelectField
          control={form.control}
          name="job_posting_id"
          label="Job Posting"
          placeholder="Select job posting"
          options={jobPostingOptions}
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
