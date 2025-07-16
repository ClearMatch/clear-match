import { getPriorityLabel } from "../../Services/Types";
import { PRIORITY_COLORS } from "../constants";

interface PriorityScoreDisplayProps {
  priority: number;
}

export default function PriorityScoreDisplay({
  priority,
}: PriorityScoreDisplayProps) {
  const priorityColorClass =
    PRIORITY_COLORS[priority] ??
    PRIORITY_COLORS[6] ??
    "text-gray-700 bg-gray-50 border-gray-200";

  return (
    <div
      className={`rounded-lg p-3 border w-[25%] justify-center flex ${priorityColorClass}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{getPriorityLabel(priority)}</span>
      </div>
    </div>
  );
}
