"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProfileDropdownProps {
  children: React.ReactNode;
}

export function ProfileDropdown({ children }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEditProfile = () => {
    setIsOpen(false);
    router.push("/profile/edit");
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    router.push("/profile/change-password");
  };

  const handleLogOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push("/auth");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 focus:outline-none"
      >
        {children}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          <button
            onClick={handleEditProfile}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <User className="h-4 w-4 mr-3" />
            Edit Profile
          </button>
          <button
            onClick={handleChangePassword}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-4 w-4 mr-3" />
            Change Password
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={handleLogOut}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}