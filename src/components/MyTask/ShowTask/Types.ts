export const getStatusColor = (status: string) => {
  switch (status) {
    case "todo":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "in-progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1:
      return "bg-red-500 text-white";
    case 2:
      return "bg-orange-500 text-white";
    case 3:
      return "bg-yellow-500 text-white";
    case 4:
      return "bg-green-500 text-white";
    case 5:
      return "bg-blue-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};
