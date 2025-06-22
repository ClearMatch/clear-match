"use client";

import { Filters, Header, TaskList } from "./MyTask";

function Task() {
  return (
    <div>
      <Header />
      <Filters />
      <TaskList />
    </div>
  );
}

export default Task;
