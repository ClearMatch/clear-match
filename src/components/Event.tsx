"use client";

import { supabase } from "@/lib/supabase";
import useSWR from "swr";
import Header from "./Event/Header";
import DataTable from "./ui/DataTable";
import { Column } from "./ui/DataTable/Types";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export interface Event {
  id: string;
  contact_id: string;
  organization_id: string;
  type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  candidates: {
    id: string;
    first_name: string;
    last_name: string;
  };
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
  };
  organizations: {
    id: string;
    name: string;
  };
}

function Events() {
  const fetchEvents = async (url: string): Promise<Event[]> => {
    const { data, error } = await supabase
      .from(url)
      .select(
        ` *, 
candidates:contact_id(id, first_name, last_name), 
profiles:created_by (id, first_name, last_name), 
organizations:organization_id(id, name)`
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  };
  const { data, isLoading } = useSWR<Event[]>("events", fetchEvents);
  if (isLoading)
    return (
      <div>
        <LoadingSpinner />
      </div>
    );

  const eventsColumn: Column<Event>[] = [
    {
      key: "type",
      header: "Type",
      render: (row) => <span className="text-sm">{row.type}</span>,
    },
    {
      key: "created_at",
      header: "Created At",
      render: (row) => (
        <span className="text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "created_by",
      header: "Created By",
      render: (row) => (
        <span className="text-sm">
          {row.profiles.first_name} {row.profiles.last_name}
        </span>
      ),
    },
    {
      key: "contact_id",
      header: "Contact Name",
      render: (row) => (
        <span className="text-sm">
          {row.candidates.first_name} {row.candidates.last_name}
        </span>
      ),
    },
    {
      key: "organization_id",
      header: "Organization",
      render: (row) => (
        <span className="text-sm">{row.organizations.name}</span>
      ),
    },
  ];

  return (
    <div>
      <Header />

      {data && (
        <DataTable
          columns={eventsColumn}
          data={data}
          rowKey="id"
          hideHeaderCheckBox
          hideRowCheckBox
        />
      )}
    </div>
  );
}

export default Events;
