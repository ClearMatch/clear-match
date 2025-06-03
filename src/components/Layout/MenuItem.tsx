"use client";

import { useRouter, usePathname } from "next/navigation";
import { MenuItemProps } from "./Types";

const MenuItem = ({ name, icon: Icon, path, isOpen }: MenuItemProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === path;

  return (
    <button
      onClick={() => router.push(path)}
      className={`flex w-full cursor-pointer items-center p-2 text-left text-sm font-normal uppercase transition-colors duration-200 lg:p-4 ${
        isActive ? "bg-[#D5D9E4] text-black" : "text-gray-900 hover:bg-gray-300"
      } ${isOpen ? "justify-start" : "justify-center"}`}
    >
      <Icon className="flex-shrink-0" />
      {isOpen && (
        <span
          className={`ml-3 text-base whitespace-nowrap transition-all duration-300 ${
            isOpen
              ? "opacity-100 translate-x-0 delay-100"
              : "opacity-0 -translate-x-2"
          }`}
        >
          {name}
        </span>
      )}
    </button>
  );
};

export default MenuItem;
