"use client";

import { ProfileGroup, Contact } from "./Types";
import ProfileAvatar from "./ProfileAvatar";

interface ProfileModalProps {
  group: ProfileGroup;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ group, isOpen, onClose }: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <group.icon className={`w-5 h-5 ${group.iconColor}`} />
              <h2 className="text-xl font-semibold text-gray-900">
                {group.name} Profiles
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.contacts.map((contact: Contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <ProfileAvatar 
                  contact={contact} 
                  size="w-10 h-10" 
                  textSize="text-sm"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {contact.first_name} {contact.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Score: {contact.engagement_score || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}