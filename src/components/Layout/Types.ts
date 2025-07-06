import {
  CalendarRange,
  ChartNoAxesCombined,
  FileText,
  ListChecks,
  LucideProps,
  MailCheck,
  Settings,
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
      { name: "Templates", icon: FileText, path: "/templates" },
      { name: "My Task", icon: ListChecks, path: "/task" },
      { name: "Inbox", icon: MailCheck, path: "/inbox" },
      { name: "Event", icon: CalendarRange, path: "/event" },
      { name: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];
