import { ExternalLink, Mail } from "lucide-react";
import Link from "next/link";

interface ContactActionLinksProps {
  contactId: string;
}

export default function ContactActionLinks({
  contactId,
}: ContactActionLinksProps) {
  return (
    <div className="pt-4 border-t border-gray-200 space-y-2">
      <Link
        href={`/contacts/show/${contactId}`}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        View Full Contact Profile
      </Link>

      <button className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium transition-colors">
        <Mail className="w-4 h-4" />
        Send Email
      </button>
    </div>
  );
}
