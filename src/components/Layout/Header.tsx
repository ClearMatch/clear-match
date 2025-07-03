"use client";

import { Menu, Search, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
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
        console.log("Header: No user found");
        return;
      }
      
      console.log("Header: User found:", { id: user.id, email: user.email });
      
      // Check client-side session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Header: Client session check:", { 
        hasSession: !!session, 
        userId: session?.user?.id,
        sessionError 
      });
      
      try {
        const response = await fetch("/api/profile", {
          credentials: 'include',
        });
        console.log("Header: API response status:", response.status);
        if (response.ok) {
          const profile = await response.json();
          setProfilePicUrl(profile.profile_pic_url);
        } else {
          const errorText = await response.text();
          console.error("Header: API error:", errorText);
        }
      } catch (error) {
        console.error("Failed to load profile picture:", error);
      }
    };

    loadProfilePic();
  }, [user]);

  return (
    <header className="bg-[#FFFFFF] border-b border-[#4859661A] h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-20">
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <Input
          startIcon={Search}
          iconClassName="text-[#50B8E4]"
          className="placeholder:text-[#1F263E] bg-[#F8F9FB] border border-gray-300 rounded-2xl	 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-60 h-30"
          placeholder="Start searching"
        />
      </div>
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
