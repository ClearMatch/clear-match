import { cn } from "@/lib/utils";
import { menuItems } from "./Types";
import { useEffect, useState } from "react";
import MenuItem from "./MenuItem";
import { supabase } from "@/lib/supabase";
import { CircleChevronLeft, CircleChevronRight, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push("/auth");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

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
      <div className="border-t border-gray-300 pt-4 mt-4">
        <button
          onClick={handleSignOut}
          className={`flex w-full cursor-pointer items-center p-2 text-left text-sm font-normal uppercase transition-all duration-300 lg:p-4 text-gray-900 hover:bg-gray-300 ${
            isOpen ? "justify-start" : "justify-center"
          }`}
        >
          <LogOut className="flex-shrink-0 h-5 w-5" />
          {isOpen && (
            <span
              className={`ml-3 text-base whitespace-nowrap transition-all duration-300 ${
                isOpen
                  ? "opacity-100 translate-x-0 delay-100"
                  : "opacity-0 -translate-x-2"
              }`}
            >
              Sign Out
            </span>
          )}
        </button>
      </div>
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
