"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

function Header() {
  const router = useRouter();
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Event</h1>
      <button
        onClick={() => router.push("/event/new")}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="h-4 w-4 mr-2" />
        <p>Add Event</p>
      </button>
    </div>
  );
}

export default Header;
