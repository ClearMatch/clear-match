"use client";

import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ProfileDropdown } from "./ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

function Header() {
  const { user } = useAuth();
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfilePic = async () => {
      if (!user) {
        return;
      }
      
      try {
        const response = await fetch("/api/profile", {
          credentials: 'include',
        });
        if (response.ok) {
          const profile = await response.json();
          setProfilePicUrl(profile.profile_pic_url);
        }
      } catch (error) {
        // Silently fail - profile picture is non-critical
      }
    };

    loadProfilePic();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadProfilePic();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user]);

  return (
    <header className="bg-[#FFFFFF] border-b border-[#4859661A] h-16 flex items-center justify-end px-6">
      <div className="flex items-center space-x-6">
        <ProfileDropdown>
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage
              src={profilePicUrl || undefined}
              alt="Profile"
            />
            <AvatarFallback className="bg-[#E8EBF4]">
              <User className="h-4 w-4 text-gray-600" />
            </AvatarFallback>
          </Avatar>
        </ProfileDropdown>
      </div>
    </header>
  );
}

export default Header;
