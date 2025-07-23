import {
  CalendarRange,
  ChartNoAxesCombined,
  ListChecks,
  LucideProps,
  Users,
} from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export interface MenuItemProps {
  name: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  path: string;
  isOpen: boolean;
}

export const menuItems = [
  {
    group: "Main",
    items: [
      { name: "Dashboard", icon: ChartNoAxesCombined, path: "/dashboard" },
      { name: "Contacts", icon: Users, path: "/contacts" },
      { name: "Tasks", icon: ListChecks, path: "/task" },
      { name: "Event", icon: CalendarRange, path: "/event" },
    ],
  },
];
