"use client";

import { Suspense } from "react";
import Task from "@/components/Task";
import { Loader } from "lucide-react";

function TaskPageContent() {
  return <Task />;
}

export default function TaskPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    }>
      <TaskPageContent />
    </Suspense>
  );
}
