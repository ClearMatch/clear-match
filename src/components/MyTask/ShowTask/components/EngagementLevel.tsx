import { TrendingUp } from "lucide-react";
import { EngagementLevel as EngagementLevelType } from "../interfaces";

interface EngagementLevelProps {
  engagement: EngagementLevelType;
}

export default function EngagementLevel({ engagement }: EngagementLevelProps) {
  return (
    <div className={`rounded-lg p-4 border ${engagement.color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Engagement Level
        </span>
        <span className="text-lg font-bold">{engagement.level}</span>
      </div>
      <p className="text-sm opacity-90">{engagement.description}</p>
    </div>
  );
}
