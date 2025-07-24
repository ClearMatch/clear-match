"use client";

import { ProfileGroup, Contact } from "./Types";
import ProfileAvatar from "./ProfileAvatar";

interface ProfileCardItemProps {
  group: ProfileGroup;
  onShowMore: (group: ProfileGroup) => void;
  onCardClick: () => void;
}

export default function ProfileCardItem({ group, onShowMore, onCardClick }: ProfileCardItemProps) {

  const renderAvatars = () => {
    const displayContacts = group.contacts.slice(0, 5);
    const remainingCount = group.contacts.length - 5;

    return (
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {displayContacts.map((contact: Contact) => (
            <ProfileAvatar 
              key={contact.id} 
              contact={contact}
            />
          ))}
        </div>
        {remainingCount > 0 && (
          <span
            className="ml-2 text-sm text-blue-500 font-medium cursor-pointer hover:text-blue-600"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              onShowMore(group);
            }}
          >
            +{remainingCount}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick();
        }
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <group.icon className={`w-4 h-4 ${group.iconColor}`} />
        <span className="text-sm font-medium text-gray-700">
          {group.name}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-4xl font-light text-gray-900">
          {group.count}
        </div>
        {group.contacts.length > 0 && renderAvatars()}
      </div>
    </div>
  );
}