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
    isValidating,
    isFetchingNextPage,
    error,
    hasMoreData,
    fetchMoreData,
    totalCount,
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

      <div className="mb-4">
        <div className="text-sm text-gray-600">
          Showing {tasks.length} tasks
        </div>
      </div>

      <TaskList
        tasks={tasks}
        loading={loading}
        isValidating={isValidating}
        isFetchingNextPage={isFetchingNextPage}
        isSearching={isSearching}
        hasMoreData={hasMoreData}
        fetchMoreData={fetchMoreData}
        error={error}
        totalCount={totalCount}
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
