"use client";

import { Contact } from "./types";

interface ProfileAvatarProps {
  contact: Contact;
  size?: string;
  textSize?: string;
}

export default function ProfileAvatar({ 
  contact, 
  size = "w-8 h-8", 
  textSize = "text-xs" 
}: ProfileAvatarProps) {
  return (
    <div
      className={`${size} rounded-full border-2 border-white bg-gray-200 flex items-center justify-center ${textSize} font-medium text-gray-600`}
      title={`${contact.first_name} ${contact.last_name}`}
    >
      <span>
        {contact.first_name?.[0]?.toUpperCase()}
        {contact.last_name?.[0]?.toUpperCase()}
      </span>
    </div>
  );
}