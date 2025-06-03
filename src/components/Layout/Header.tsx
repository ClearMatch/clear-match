"use client";

import { Megaphone, Menu, Search, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";

function Header() {
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
        <Avatar className="h-8 w-8">
          <AvatarImage
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
            alt="Profile"
          />
          <AvatarFallback className="bg-[#E8EBF4]">MG</AvatarFallback>
        </Avatar>
        <button className="hover:bg-[#E8EBF4] rounded-full">
          <Settings className="h-5 w-5 text-gray-600" />
        </button>
        <button className="relative hover:bg-gray-100 rounded-lg">
          <Megaphone className="h-5 w-5 text-gray-600" />
          <span className="absolute -top-3 -right-4 h-5 w-5 bg-[#F56C89] text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>
        <Avatar className="h-5 w-5 rounded-full overflow-hidden">
          <AvatarImage
            src="https://flagcdn.com/us.svg"
            alt="flag"
            className="rounded-full object-cover"
          />
          <AvatarFallback className="bg-[#E8EBF4] rounded-full">
            USA
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

export default Header;
