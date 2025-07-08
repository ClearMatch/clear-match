"use client";

import FilterSelect from "@/components/Contact/FilterSelect";
import { getFullName } from "@/components/MyTask/Services/Types";
import { useTaskData } from "@/components/MyTask/Services/useTaskData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOpenable } from "@/hooks";
import { ChevronDown, Filter, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { eventTypes } from "../Common/constants";
import { FilterConfig, FilterState, INITIAL_FILTERS } from "./Types";

interface EventFiltersProps {
  onFiltersApply: (filters: FilterState) => void;
  onFiltersClear: () => void;
}

function EventFilters({ onFiltersApply, onFiltersClear }: EventFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState(INITIAL_FILTERS);
  const { contacts, organizations, users } = useTaskData();
  const { isOpen, onClose, onOpenChange } = useOpenable();

  const filterOptions = useMemo(
    () => ({
      contact: contacts.map((contact) => ({
        value: contact.id,
        label: getFullName(contact.first_name, contact.last_name),
      })),
      user: users.map((user) => ({
        value: user.id,
        label: getFullName(user.first_name, user.last_name),
      })),
      organization: organizations.map((organization) => ({
        value: organization.id,
        label: organization.name,
      })),
    }),
    [contacts, users, organizations]
  );

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "type",
        placeholder: "Type",
        label: "Type",
        options: eventTypes,
      },
      {
        key: "createdBy",
        placeholder: "Created By",
        label: "Created By",
        options: filterOptions.user,
      },
      {
        key: "contact",
        placeholder: "Contact",
        label: "Contact",
        options: filterOptions.contact,
      },
      {
        key: "organization",
        placeholder: "Organization",
        label: "Organization",
        options: filterOptions.organization,
      },
    ],
    [filterOptions]
  );

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setSelectedFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSelectedFilters(INITIAL_FILTERS);
    onFiltersClear();
  }, [onFiltersClear]);

  const handleApplyFilters = useCallback(() => {
    onFiltersApply(selectedFilters);
  }, [selectedFilters, onFiltersApply]);

  const hasActiveFilters = useMemo(
    () => Object.values(selectedFilters).some((value) => value !== ""),
    [selectedFilters]
  );

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={onOpenChange}
          className="W-fit items-center mb-4 flex rounded-md px-4 py-2 text-sm font-medium text-white bg-indigo-600"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          <ChevronDown className="h-4 w-4 ml-2" />
        </button>
      </div>
      {isOpen && (
        <Card className="mb-4 p-4 pb-0">
          <X
            onClick={onClose}
            className="hover:text-gray-600 float-right cursor-pointer"
          />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filterConfigs.map((config) => (
                <FilterSelect
                  key={config.key}
                  selected={selectedFilters[config.key]}
                  onChange={(value) => handleFilterChange(config.key, value)}
                  options={config.options}
                  placeholder={config.placeholder}
                  label={config.label}
                />
              ))}
            </div>
            <div className="flex justify-end w-full gap-4 mt-4">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="text-sm font-medium"
              >
                Clear
              </Button>
              <Button
                onClick={handleApplyFilters}
                className="text-sm font-medium text-white !bg-indigo-600 hover:bg-indigo-700"
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default EventFilters;
