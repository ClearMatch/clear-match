"use client";

import { useState } from "react";
import { Filters, Header, TaskList } from "./MyTask";

function Task() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div>
      <Header />
      <Filters onSearch={handleSearch} searchTerm={searchTerm} />
      <TaskList searchTerm={searchTerm} />
    </div>
  );
}

export default Task;
