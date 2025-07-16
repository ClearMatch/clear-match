"use client";

import { useState, useEffect } from "react";
import { Bot, Flame, Heart, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ProfileGroup } from "./types";
import ProfileModal from "./ProfileModal";
import ProfileCardItem from "./ProfileCardItem";
import LoadingSkeleton from "./LoadingSkeleton";

function ProfileCard() {
  const { user } = useAuth();
  const [profileGroups, setProfileGroups] = useState<ProfileGroup[]>([
    {
      name: "Profile A",
      scoreRange: "8-10",
      minScore: 8,
      maxScore: 10,
      icon: Flame,
      iconColor: "text-orange-500",
      contacts: [],
      count: 0,
    },
    {
      name: "Profile B",
      scoreRange: "6-7",
      minScore: 6,
      maxScore: 7,
      icon: Heart,
      iconColor: "text-red-500",
      contacts: [],
      count: 0,
    },
    {
      name: "Profile C",
      scoreRange: "4-5",
      minScore: 4,
      maxScore: 5,
      icon: User,
      iconColor: "text-blue-500",
      contacts: [],
      count: 0,
    },
    {
      name: "Profile D",
      scoreRange: "1-3",
      minScore: 1,
      maxScore: 3,
      icon: Bot,
      iconColor: "text-gray-500",
      contacts: [],
      count: 0,
    },
  ]);
  const [selectedGroup, setSelectedGroup] = useState<ProfileGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactsByEngagementScore();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchContactsByEngagementScore = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all contacts with engagement scores
      const { data: contacts, error } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, engagement_score")
        .not("engagement_score", "is", null)
        .order("engagement_score", { ascending: false });

      if (error) {
        return;
      }

      // Group contacts by engagement score ranges
      const updatedGroups = profileGroups.map((group) => {
        const groupContacts =
          contacts?.filter(
            (contact) =>
              contact.engagement_score >= group.minScore &&
              contact.engagement_score <= group.maxScore
          ) || [];

        return {
          ...group,
          contacts: groupContacts,
          count: groupContacts.length,
        };
      });

      setProfileGroups(updatedGroups);
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group: ProfileGroup) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {profileGroups.map((group, index) => (
          <ProfileCardItem
            key={index}
            group={group}
            onShowMore={() => handleGroupClick(group)}
          />
        ))}
      </div>
      {selectedGroup && (
        <ProfileModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          group={selectedGroup}
        />
      )}
    </>
  );
}

export default ProfileCard;
