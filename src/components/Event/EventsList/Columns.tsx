import { Column } from "@/components/ui/DataTable/Types";
import { formatDate } from "@/lib/utils";
import { EventData } from "../Services/Types";
import { ExternalLink } from "lucide-react";

function Columns(): Column<EventData>[] {
  return [
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium capitalize">{row.type.replace('-', ' ')}</span>
          {row.type === 'job-posting' && (
            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full mt-1 w-fit">
              Job Listing
            </span>
          )}
        </div>
      ),
    },
    {
      key: "position",
      header: "Position & Company",
      render: (row) => {
        if (row.type === 'job-posting') {
          return (
            <div className="flex flex-col space-y-1">
              {row.position && (
                <span className="text-sm font-medium text-blue-700">
                  {row.position}
                </span>
              )}
              {row.company_name && (
                <span className="text-xs text-gray-600">
                  at {row.company_name}
                </span>
              )}
              {row.company_location && (
                <span className="text-xs text-gray-500">
                  📍 {row.company_location}
                </span>
              )}
            </div>
          );
        }
        // For non-job events, show contact info
        return row.contact && row.contact[0] ? (
          <span className="text-sm">
            {row.contact[0].first_name} {row.contact[0].last_name}
          </span>
        ) : (
          <span className="text-sm text-gray-400">No contact</span>
        );
      },
    },
    {
      key: "contact_name",
      header: "Contact Info",
      render: (row) => {
        if (row.type === 'job-posting') {
          return (
            <div className="flex flex-col space-y-1">
              {row.contact_name && (
                <span className="text-sm">
                  {row.contact_name}
                </span>
              )}
              {row.contact_linkedin && (
                <a
                  href={row.contact_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>LinkedIn</span>
                </a>
              )}
            </div>
          );
        }
        // For non-job events, show organization
        return (
          <span className="text-sm">{row.organizations?.[0]?.name}</span>
        );
      },
    },
    {
      key: "metro_area",
      header: "Location",
      render: (row) => {
        if (row.type === 'job-posting') {
          return (
            <div className="flex flex-col space-y-1">
              {row.metro_area && (
                <div className="flex flex-wrap gap-1">
                  {row.metro_area.split(';').slice(0, 2).map((area, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                    >
                      {area.trim()}
                    </span>
                  ))}
                  {row.metro_area.split(';').length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{row.metro_area.split(';').length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        }
        return null;
      },
    },
    {
      key: "posted_on",
      header: "Dates",
      render: (row) => (
        <div className="flex flex-col space-y-1">
          {row.type === 'job-posting' && row.posted_on && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Posted</span>
              <span className="text-sm font-medium">
                {formatDate(row.posted_on)}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Created</span>
            <span className="text-sm">
              {formatDate(row.created_at)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "job_listing_url",
      header: "Links",
      render: (row) => {
        if (row.type === 'job-posting') {
          return (
            <div className="flex flex-col space-y-2">
              {row.job_listing_url && (
                <a
                  href={row.job_listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View Job</span>
                </a>
              )}
              {row.company_website && (
                <a
                  href={row.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Company</span>
                </a>
              )}
            </div>
          );
        }
        return null;
      },
    },
    {
      key: "created_by",
      header: "Created By",
      render: (row) => (
        <span className="text-sm">
          {row.profiles?.[0]?.first_name} {row.profiles?.[0]?.last_name}
        </span>
      ),
    },
  ];
}

export default Columns;
