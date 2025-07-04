import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export interface ErrorPageProps {
  Icon?: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  title?: string;
  description?: string;
  errorDescription?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}
