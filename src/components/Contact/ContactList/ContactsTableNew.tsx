"use client";

import DataTable from "@/components/ui/DataTable";
import { Column, SortSelection } from "@/components/ui/DataTable/Types";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Actions from "./Actions";
import { Contact, SortConfig, SortField } from "./Types";
import { EngagementScoreDropdown } from "./EngagementScoreDropdown";

interface ContactsTableProps {
  contacts: Contact[];
  onDelete: (contactId: string) => void;
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
}

function ContactsTable({
  contacts,
  onDelete,
  sort,
  onSortChange,
}: ContactsTableProps) {
  const router = useRouter();

  const [sortSelection, setSortSelection] = useState<SortSelection>({
    sortBy: sort.field,
    sortOrder: sort.direction,
  });

  useEffect(() => {
    setSortSelection({
      sortBy: sort.field,
      sortOrder: sort.direction,
    });
  }, [sort.field, sort.direction]);

  const handleSortChange = (
    newSortSelection: SortSelection | ((prev: SortSelection) => SortSelection)
  ) => {
    const finalSortSelection =
      typeof newSortSelection === "function"
        ? newSortSelection(sortSelection)
        : newSortSelection;

    setSortSelection(finalSortSelection);
    onSortChange(finalSortSelection.sortBy as SortField);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const contactColumns: Column<Contact>[] = [
    {
      key: "first_name",
      header: "First Name",
      sortable: true,
      render: (row) => (
        <span
          className="text-sm font-medium text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors duration-200"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/contacts/show/${row.id}`);
          }}
        >
          {row.first_name}
        </span>
      ),
    },
    {
      key: "last_name",
      header: "Last Name",
      sortable: true,
      render: (row) => (
        <span
          className="text-sm font-medium text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors duration-200"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/contacts/show/${row.id}`);
          }}
        >
          {row.last_name}
        </span>
      ),
    },
    {
      key: "current_job_title",
      header: "Job Title",
      render: (row) => (
        <span className="text-sm text-gray-600">{row.current_job_title}</span>
      ),
    },
    {
      key: "personal_email",
      header: "Contact",
      render: (row) => (
        <div className="space-y-1 text-sm">
          {row.personal_email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <a
                href={`mailto:${row.personal_email}`}
                className="text-gray-500 hover:text-indigo-600"
              >
                {row.personal_email}
              </a>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "engagement_score",
      header: "Engagement",
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <EngagementScoreDropdown
            contactId={row.id}
            currentScore={row.engagement_score}
          />
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        columns={contactColumns}
        data={contacts}
        rowKey="id"
        hideHeaderCheckBox
        hideRowCheckBox
        sortSelection={sortSelection}
        setSortSelection={handleSortChange}
        renderAction={(row) => <Actions id={row.id} onDelete={onDelete} />}
      />
    </div>
  );
}

export default ContactsTable;
