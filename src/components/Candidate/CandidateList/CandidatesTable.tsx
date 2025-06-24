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
import { Candidate, SortConfig, SortField, SortDirection } from "./Types";

interface CandidatesTableProps {
  candidates: Candidate[];
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
  onEdit: (candidate: Candidate) => void;
  onDelete: (candidate: Candidate) => void;
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

export function CandidatesTable({
  candidates,
  sort,
  onSortChange,
  onEdit,
  onDelete,
}: CandidatesTableProps) {
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
          {candidates.map((candidate) => (
            <TableRow key={candidate.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-indigo-600">
                {candidate.first_name}
              </TableCell>
              <TableCell className="font-medium text-indigo-600">
                {candidate.last_name}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {candidate.current_job_title && (
                    <div className="font-medium text-sm text-gray-500">
                      {candidate.current_job_title}
                    </div>
                  )}
                  {candidate.current_company && (
                    <div className="text-sm text-gray-500">
                      {candidate.current_company}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  {candidate.personal_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${candidate.personal_email}`}
                        className="text-gray-500 hover:text-indigo-600"
                      >
                        {candidate.personal_email}
                      </a>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">{candidate.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {candidate.current_location || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {candidate.years_of_experience ? `${candidate.years_of_experience} years` : '-'}
              </TableCell>
              <TableCell>
                {candidate.engagement_score ? (
                  <Badge variant="outline" className="text-xs">
                    {formatEngagementScore(candidate.engagement_score)}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {candidate.tech_stack?.slice(0, 3).map((tech, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {candidate.tech_stack && candidate.tech_stack.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{candidate.tech_stack.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {candidate.is_active_looking && (
                    <Badge className="text-xs bg-green-100 text-green-800">
                      Active
                    </Badge>
                  )}
                  {candidate.tags?.map((tag) => (
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
                {formatDate(candidate.created_at)}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(candidate.updated_at)}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/candidates/edit/${candidate.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(candidate)}
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