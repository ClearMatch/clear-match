import { cn } from "@/lib/utils";
import { menuItems } from "./Types";
import { useState } from "react";
import MenuItem from "./MenuItem";
import { CircleChevronLeft, CircleChevronRight } from "lucide-react";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <aside
      className={cn(
        "relative py-6 shadow-md transition-all duration-300 shadow-lg bg-[#E8EBF4] flex flex-col",
        isOpen ? "w-[289px]" : "w-[60px]"
      )}
    >
      <div className="flex flex-row items-center pl-3 overflow-hidden mb-6">
        <span className="text-[50px] font-light text-transparent bg-clip-text bg-gradient-to-r from-[#5900FF] to-[#5900FF] flex-shrink-0">
          C
        </span>
        <span
          className={`text-xl font-light text-black whitespace-nowrap transition-all duration-300 ease-in-out ml-1 ${
            isOpen
              ? "opacity-100 translate-x-0 delay-100"
              : "opacity-0 -translate-x-4"
          }`}
        >
          lear Match Talent
        </span>
      </div>
      <nav className="flex-1">
        {menuItems.map(({ group, items }) => (
          <div key={group} className="space-y-1">
            {isOpen && group !== "Main" && (
              <p
                className={`mt-7 ml-2 text-sm font-semibold text-gray-600 uppercase transition-all duration-300 ${
                  isOpen ? "opacity-100 delay-150" : "opacity-0"
                }`}
              >
                {group}
              </p>
            )}
            {items.map((item) => (
              <MenuItem
                key={item.name}
                {...item}
                path={item.path}
                isOpen={isOpen}
              />
            ))}
          </div>
        ))}
      </nav>
      <button
        onClick={toggleSidebar}
        className="absolute -right-2 top-5 z-10  shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isOpen ? (
          <CircleChevronLeft className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        ) : (
          <CircleChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        )}
      </button>
    </aside>
  );
}

export default Sidebar;
