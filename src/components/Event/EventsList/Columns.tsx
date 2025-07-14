import { Column } from "@/components/ui/DataTable/Types";
import { formatDate } from "@/lib/utils";
import { EventData } from "../Services/Types";

function Columns(): Column<EventData>[] {
  return [
    {
      key: "type",
      header: "Type",
      render: (row) => <span className="text-sm">{row.type}</span>,
    },
    {
      key: "created_at",
      header: "Created At",
      render: (row) => (
        <span className="text-sm">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "created_by",
      header: "Created By",
      render: (row) => (
        <span className="text-sm">
          {row.profiles?.first_name} {row.profiles?.last_name}
        </span>
      ),
    },
    {
      key: "contact_id",
      header: "Contact Name",
      render: (row) => (
        <span className="text-sm">
          {row.contact?.first_name} {row.contact?.last_name}
        </span>
      ),
    },
    {
      key: "organization_id",
      header: "Organization",
      render: (row) => (
        <span className="text-sm">{row.organizations?.name}</span>
      ),
    },
  ];
}

export default Columns;
