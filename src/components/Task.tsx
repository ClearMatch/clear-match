"use client";

import { Header } from "./MyTask";
import TaskSearchAndFilterBar from "./MyTask/Filters";
import { useTasks } from "./MyTask/Services/useTasks";
import TaskList from "./MyTask/TaskList";

function Task() {
  const {
    searchInputValue,
    onSearchChange,
    isSearching,
    filters,
    setFilters,
    showFilters,
    onToggleFilters,
    clearFilters,
    tasks,
    assigneeOptions,
    creatorOptions,
    loading,
    error,
  } = useTasks();

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-red-500">Error loading tasks: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <TaskSearchAndFilterBar
        searchInputValue={searchInputValue}
        onSearchChange={onSearchChange}
        isSearching={isSearching}
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        clearFilter={clearFilters}
        assigneeOptions={assigneeOptions}
        creatorOptions={creatorOptions}
      />
      <TaskList
        tasks={tasks}
        loading={loading}
        isSearching={isSearching}
        hasNoResults={
          tasks.length === 0 &&
          (!!searchInputValue ||
            Object.values(filters).some((f) => f.length > 0))
        }
      />
    </div>
  );
}

export default Task;
