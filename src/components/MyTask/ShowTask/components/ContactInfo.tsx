import { Building, Mail, MapPin, Phone } from "lucide-react";
import { Contact } from "../interfaces";

interface ContactInfoProps {
  contact: Contact;
}

export default function ContactInfo({ contact }: ContactInfoProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <h3 className="text-lg font-bold text-blue-900 mb-2">
        {contact.first_name} {contact.last_name}
      </h3>
      <div className="space-y-1 text-sm text-blue-700">
        {contact.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.company && (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span>{contact.company}</span>
          </div>
        )}
        {contact.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{contact.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}
