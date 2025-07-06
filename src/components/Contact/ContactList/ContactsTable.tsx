import React from "react";
import { ChevronUp, ChevronDown, ArrowUpDown, Phone, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Contact, SortConfig, SortField, SortDirection } from "./Types";

interface ContactsTableProps {
  contacts: Contact[];
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentSort: SortConfig;
  onSortChange: (field: SortField) => void;
}

function SortableHeader({ field, label, currentSort, onSortChange }: SortableHeaderProps) {
  const isActive = currentSort.field === field;
  const direction = isActive ? currentSort.direction : null;

  return (
    <TableHead className="cursor-pointer select-none" onClick={() => onSortChange(field)}>
      <div className="flex items-center space-x-1 hover:text-blue-600">
        <span>{label}</span>
        {isActive ? (
          direction === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );
}

export function ContactsTable({
  contacts,
  sort,
  onSortChange,
  onEdit,
  onDelete,
}: ContactsTableProps) {
  const router = useRouter();
  const formatEngagementScore = (score?: number) => {
    if (!score) return '';
    const labels = {
      5: 'High',
      4: 'Strong', 
      3: 'Standard',
      2: 'Sub Par',
      1: 'Avoid'
    };
    return labels[score as keyof typeof labels] || score.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader
              field="first_name"
              label="First Name"
              currentSort={sort}
              onSortChange={onSortChange}
            />
            <SortableHeader
              field="last_name"
              label="Last Name"
              currentSort={sort}
              onSortChange={onSortChange}
            />
            <TableHead>Title & Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
            <SortableHeader
              field="years_of_experience"
              label="Experience"
              currentSort={sort}
              onSortChange={onSortChange}
            />
            <SortableHeader
              field="engagement_score"
              label="Engagement"
              currentSort={sort}
              onSortChange={onSortChange}
            />
            <TableHead>Tech Stack</TableHead>
            <TableHead>Status</TableHead>
            <SortableHeader
              field="created_at"
              label="Created"
              currentSort={sort}
              onSortChange={onSortChange}
            />
            <SortableHeader
              field="updated_at"
              label="Updated"
              currentSort={sort}
              onSortChange={onSortChange}
            />
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-indigo-600">
                <span 
                  className="cursor-pointer hover:text-indigo-800 transition-colors duration-200"
                  onClick={() => router.push(`/contacts/show/${contact.id}`)}
                >
                  {contact.first_name}
                </span>
              </TableCell>
              <TableCell className="font-medium text-indigo-600">
                <span 
                  className="cursor-pointer hover:text-indigo-800 transition-colors duration-200"
                  onClick={() => router.push(`/contacts/show/${contact.id}`)}
                >
                  {contact.last_name}
                </span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {contact.current_job_title && (
                    <div className="font-medium text-sm text-gray-500">
                      {contact.current_job_title}
                    </div>
                  )}
                  {contact.current_company && (
                    <div className="text-sm text-gray-500">
                      {contact.current_company}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  {contact.personal_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${contact.personal_email}`}
                        className="text-gray-500 hover:text-indigo-600"
                      >
                        {contact.personal_email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">{contact.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {typeof contact.current_location === 'string' 
                  ? contact.current_location 
                  : contact.current_location?.location || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {contact.years_of_experience ? `${contact.years_of_experience} years` : '-'}
              </TableCell>
              <TableCell>
                {contact.engagement_score ? (
                  <Badge variant="outline" className="text-xs">
                    {formatEngagementScore(contact.engagement_score)}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.tech_stack?.slice(0, 3).map((tech, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {contact.tech_stack && contact.tech_stack.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{contact.tech_stack.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.is_active_looking && (
                    <Badge className="text-xs bg-green-100 text-green-800">
                      Active
                    </Badge>
                  )}
                  {contact.tags?.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-xs"
                      style={{ 
                        borderColor: tag.color,
                        color: tag.color 
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(contact.created_at)}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(contact.updated_at)}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/contacts/edit/${contact.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(contact)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}