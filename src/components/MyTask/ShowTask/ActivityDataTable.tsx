"use client";

import { formatDate } from "@/lib/utils";
import { Database, ExternalLink, Calendar, User, Building2 } from "lucide-react";
import { ActivityWithRelations, getFullName, getPriorityLabel } from "../Services/Types";
import { getStatusColor, getPriorityColor } from "./Types";

interface ActivityDataTableProps {
  taskData: ActivityWithRelations;
}

interface DataRow {
  category: string;
  label: string;
  value: string | null | undefined;
  renderValue?: (value: any) => React.ReactNode;
  icon?: React.ReactNode;
}

export default function ActivityDataTable({ taskData }: ActivityDataTableProps) {
  const dataRows: DataRow[] = [
    // Core Activity Data
    {
      category: "Activity",
      label: "Smart Title",
      value: taskData.subject || taskData.description,
      icon: <Database className="w-4 h-4" />,
    },
    {
      category: "Activity",
      label: "Description",
      value: taskData.description,
      icon: <Database className="w-4 h-4" />,
    },
    {
      category: "Activity",
      label: "Content",
      value: taskData.content,
      icon: <Database className="w-4 h-4" />,
    },
    {
      category: "Activity",
      label: "Type",
      value: taskData.type,
      icon: <Database className="w-4 h-4" />,
    },
    {
      category: "Activity",
      label: "Status",
      value: taskData.status,
      renderValue: (status) => (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status || "")}`}>
          {status?.replace("-", " ")}
        </span>
      ),
      icon: <Database className="w-4 h-4" />,
    },
    {
      category: "Activity",
      label: "Priority",
      value: taskData.priority?.toString(),
      renderValue: (priority) => (
        <span className={`px-2 py-1 rounded text-sm font-bold ${getPriorityColor(priority || 0)}`}>
          {getPriorityLabel(priority || 0)}
        </span>
      ),
      icon: <Database className="w-4 h-4" />,
    },
    {
      category: "Activity",
      label: "Due Date",
      value: taskData.due_date,
      renderValue: (date) => formatDate(date),
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      category: "Activity",
      label: "Created At",
      value: taskData.created_at,
      renderValue: (date) => formatDate(date),
      icon: <Calendar className="w-4 h-4" />,
    },

    // Contact Information
    {
      category: "Contact",
      label: "Contact Name",
      value: getFullName(taskData.contacts?.first_name, taskData.contacts?.last_name),
      icon: <User className="w-4 h-4" />,
    },
    {
      category: "Contact",
      label: "Contact ID",
      value: taskData.contact_id,
      icon: <User className="w-4 h-4" />,
    },
    {
      category: "Contact",
      label: "Created By",
      value: getFullName(taskData.profiles?.first_name, taskData.profiles?.last_name),
      icon: <User className="w-4 h-4" />,
    },
    {
      category: "Contact",
      label: "Assigned To",
      value: getFullName(taskData.assigned_to_profile?.first_name, taskData.assigned_to_profile?.last_name),
      icon: <User className="w-4 h-4" />,
    },

    // Clay Event Data
    {
      category: "Clay Event",
      label: "Company Name",
      value: taskData.events?.company_name,
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      category: "Clay Event",
      label: "Job Title",
      value: taskData.events?.job_title || taskData.events?.position,
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      category: "Clay Event",
      label: "Position",
      value: taskData.events?.position,
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      category: "Clay Event",
      label: "Posted On",
      value: taskData.events?.posted_on,
      renderValue: (date) => date ? formatDate(date) : "N/A",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      category: "Clay Event",
      label: "Metro Area",
      value: taskData.events?.metro_area,
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      category: "Clay Event",
      label: "Company Location",
      value: taskData.events?.company_location,
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      category: "Clay Event",
      label: "Company Website",
      value: taskData.events?.company_website,
      renderValue: (url) => url ? (
        <a 
          href={url.startsWith('http') ? url : `https://${url}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {url}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : "N/A",
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      category: "Clay Event",
      label: "Job Listing URL",
      value: taskData.events?.job_listing_url,
      renderValue: (url) => url ? (
        <a 
          href={url.startsWith('http') ? url : `https://${url}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View Job Posting
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : "N/A",
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      category: "Clay Event",
      label: "Contact Name (from Clay)",
      value: taskData.events?.contact_name,
      icon: <User className="w-4 h-4" />,
    },
    {
      category: "Clay Event",
      label: "Contact LinkedIn",
      value: taskData.events?.contact_linkedin,
      renderValue: (url) => url ? (
        <a 
          href={url.startsWith('http') ? url : `https://${url}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          LinkedIn Profile
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : "N/A",
      icon: <User className="w-4 h-4" />,
    },

    // System Information
    {
      category: "System",
      label: "Activity ID",
      value: taskData.id,
      icon: <Database className="w-4 h-4" />,
    },
    {
      category: "System",
      label: "Organization ID",
      value: taskData.organization_id ? `${taskData.organization_id.slice(0, 8)}...` : "N/A",
      icon: <Database className="w-4 h-4" />,
    },
    {
      category: "System",
      label: "Event ID",
      value: taskData.event_id ? `${taskData.event_id.slice(0, 8)}...` : "N/A",
      icon: <Database className="w-4 h-4" />,
    },
    {
      category: "System",
      label: "Job Posting ID",
      value: taskData.job_posting_id ? `${taskData.job_posting_id.slice(0, 8)}...` : "N/A",
      icon: <Database className="w-4 h-4" />,
    },
  ];

  // Group data by category
  const groupedData = dataRows.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = [];
    }
    acc[row.category]!.push(row);
    return acc;
  }, {} as Record<string, DataRow[]>);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Activity":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "Contact":
        return "bg-green-50 border-green-200 text-green-800";
      case "Clay Event":
        return "bg-purple-50 border-purple-200 text-purple-800";
      case "System":
        return "bg-gray-50 border-gray-200 text-gray-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Database className="w-6 h-6 text-indigo-600" />
        All Activity Data
      </h2>
      
      <div className="space-y-8">
        {Object.entries(groupedData).map(([category, rows]) => (
          <div key={category}>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border mb-4 ${getCategoryColor(category)}`}>
              {rows[0]?.icon}
              {category}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Field</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const displayValue = row.value && row.value !== "N/A" && row.value.trim() !== "" ? row.value : null;
                    
                    let renderedValue;
                    try {
                      renderedValue = displayValue && row.renderValue 
                        ? row.renderValue(displayValue) 
                        : displayValue || <span className="text-gray-400 italic">N/A</span>;
                    } catch (renderError) {
                      console.warn(`Error rendering value for ${row.label}:`, renderError);
                      renderedValue = <span className="text-red-400 italic">Error rendering value</span>;
                    }
                    
                    // Special handling for missing contact/event data
                    const isMissingData = !displayValue && (
                      row.category === "Contact" || 
                      row.category === "Clay Event"
                    );
                    
                    return (
                      <tr key={`${category}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 border-b border-gray-100 font-medium text-gray-700">
                          {row.label}
                          {isMissingData && (
                            <span className="ml-2 text-xs text-amber-600 font-normal">
                              (missing)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 border-b border-gray-100 text-gray-900">
                          {renderedValue}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}