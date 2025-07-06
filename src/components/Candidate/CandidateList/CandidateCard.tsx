"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Building,
  Edit,
  Mail,
  MapPin,
  Phone,
  Tags,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { Contact } from "./Types";

interface ContactCardProps {
  contact: Contact;
  onEdit: (contactId: string) => void;
  onDelete: (contactId: string) => void;
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
}: ContactCardProps) {
  const router = useRouter();
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5 pr-12 cursor-pointer relative">
        <button
          className="absolute top-4 right-4 z-10"
          onClick={() => router.push(`/contacts/edit/${contact.id}`)}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </button>
        <button
          className="absolute top-10 right-4 z-10"
          onClick={() => onDelete(contact.id)}
        >
          <Trash2 color="red" className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </button>
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <h3 
                className="text-lg font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/contacts/show/${contact.id}`);
                }}
              >
                {contact.first_name} {contact.last_name}
              </h3>
              {contact?.is_active_looking && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-green-50 text-green-700 border-green-200"
                >
                  Active
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Briefcase className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
              <p>
                {contact.current_job_title} at {contact.current_company}
              </p>
            </div>
            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
              <MapPin className="flex-shrink-0 h-4 w-4 text-gray-400" />
              <span>
                {typeof contact?.current_location === 'string' 
                  ? contact.current_location 
                  : contact?.current_location?.location || '-'}
              </span>
            </div>

            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
              <Building className="flex-shrink-0 h-4 w-4 text-gray-400" />
              <span>{contact?.functional_role}</span>
            </div>

            {contact?.tech_stack && contact?.tech_stack.length > 0 && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                <Tags className="flex-shrink-0 h-4 w-4 text-gray-400" />
                <span>{contact?.tech_stack.join(", ")}</span>
              </div>
            )}
          </div>
          <div className="md:ml-4 mt-4 md:mt-0 flex flex-col space-y-2 md:items-end">
            {contact?.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">{contact.phone}</span>
              </div>
            )}
            {contact?.work_email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${contact.work_email}`}
                  className="text-sm text-gray-500 hover:text-indigo-600"
                >
                  {contact.work_email}
                </a>
              </div>
            )}
          </div>
        </div>
        {contact.tags && contact.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {contact?.tags.map(
              (tag: {
                id: React.Key | null | undefined;
                color: string;
                name: string;
              }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: `${tag.color}40`,
                  }}
                >
                  {tag.name}
                </Badge>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
