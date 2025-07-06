"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  selected: string;
  onChange: (newValue: string) => void;
  options: Option[];
  placeholder: string;
  label: string;
};

function FilterSelect({
  selected,
  onChange,
  options,
  placeholder,
  label,
}: FilterSelectProps) {
  const selectedLabel = selected
    ? options.find((opt) => opt.value === selected)?.label
    : "";

  return (
    <div>
      <div className="text-lg font-medium text-gray-700 mb-4">{label}</div>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-gray-100 border border-gray-300 pl-3 pr-7">
          <SelectValue placeholder={placeholder}>
            {selectedLabel || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white shadow-lg">
          {options.map((opt) => (
            <SelectItem
              className={cn(
                "cursor-pointer",
                selected.includes(opt.value)
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white"
              )}
              key={opt.value}
              value={opt.value}
              isChecked={selected.includes(opt.value)}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default FilterSelect;
