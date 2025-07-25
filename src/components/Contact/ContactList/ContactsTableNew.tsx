"use client";

import DataTable from "@/components/ui/DataTable";
import { Column, SortSelection } from "@/components/ui/DataTable/Types";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Actions from "./Actions";
import { Contact, SortConfig, SortField } from "./Types";

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

  const formatEngagementScore = (score?: number) => {
    if (!score) return "";
    return score.toString();
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
      header: "Title & Company",
      render: (row) => (
        <div className="space-y-1">
          {row.current_job_title && (
            <div className="text-sm font-medium text-gray-500">
              {row.current_job_title}
            </div>
          )}
          {row.current_company && (
            <div className="text-sm text-gray-500">{row.current_company}</div>
          )}
        </div>
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
      key: "current_location",
      header: "Location",
      render: (row) => (
        <span className="text-sm text-gray-500">
          {typeof row.current_location === "string"
            ? row.current_location
            : row.current_location?.location || "-"}
        </span>
      ),
    },
    {
      key: "years_of_experience",
      header: "Experience",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-500">
          {row.years_of_experience ? `${row.years_of_experience} years` : "-"}
        </span>
      ),
    },
    {
      key: "engagement_score",
      header: "Engagement",
      render: (row) => (
        <div>
          {row.engagement_score ? (
            <Badge variant="outline" className="text-xs">
              {formatEngagementScore(row.engagement_score)}
            </Badge>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </div>
      ),
    },
    {
      key: "tech_stack",
      header: "Tech Stack",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.tech_stack?.slice(0, 3).map((tech, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
          {row.tech_stack && row.tech_stack.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{row.tech_stack.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "is_active_looking",
      header: "Status",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.is_active_looking && (
            <Badge className="text-xs bg-green-100 text-green-800">
              Active
            </Badge>
          )}
          {row.tags?.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs"
              style={{
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              {tag.name}
            </Badge>
          ))}
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
    {
      key: "updated_at",
      header: "Updated",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.updated_at)}
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
