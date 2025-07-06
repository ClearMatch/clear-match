"use client";

import { ArrowUpRight, Building2, User, Users } from "lucide-react";
import { RecommendedAction } from "./Types";

interface RecommendedActionsProps {
  actions: RecommendedAction[];
}

interface ActionItemProps {
  action: RecommendedAction;
  onTakeAction?: (actionId: string) => void;
}

const PriorityIndicator: React.FC<{
  priority: RecommendedAction["priority"];
}> = ({ priority }) => {
  const colorMap = {
    high: "bg-red-600",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  return (
    <div className={`w-2 h-2 mt-2 ${colorMap[priority]} rounded-full`}></div>
  );
};

const TypeIndicator: React.FC<{ type: RecommendedAction["type"] }> = ({
  type,
}) => {
  switch (type) {
    case "contact":
      return <User className="h-4 w-4 text-blue-600" />;
    case "client":
      return <Building2 className="h-4 w-4 text-green-600" />;
    case "both":
      return <Users className="h-4 w-4 text-purple-600" />;
    default:
      return <User className="h-4 w-4 text-gray-600" />;
  }
};

const getTypeBadgeStyles = (type: RecommendedAction["type"]) => {
  switch (type) {
    case "contact":
      return "bg-blue-100 text-blue-800";
    case "client":
      return "bg-green-100 text-green-800";
    case "both":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeLabel = (type: RecommendedAction["type"]) => {
  switch (type) {
    case "contact":
      return "Contact";
    case "client":
      return "Client";
    case "both":
      return "Both";
    default:
      return "Unknown";
  }
};

const ActionItem: React.FC<ActionItemProps> = ({ action, onTakeAction }) => {
  const handleTakeAction = () => {
    if (onTakeAction) {
      onTakeAction(action.id);
    }
  };

  return (
    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 flex flex-col items-center">
        <PriorityIndicator priority={action.priority} />
        <div className="mt-2">
          <TypeIndicator type={action.type} />
        </div>
      </div>

      <div className="ml-4 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">
              {action.contactName || "Unknown"}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeStyles(
                action.type
              )}`}
            >
              {getTypeLabel(action.type)}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {action.dueDate && new Date(action.dueDate).toLocaleDateString()}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-600">{action.reason}</p>

        <div className="mt-2">
          <button
            onClick={handleTakeAction}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
          >
            Take action
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const RecommendedActions: React.FC<RecommendedActionsProps> = ({
  actions,
}) => {
  const handleTakeAction = (actionId: string) => {
    // TODO: Implement action handling logic
    console.log("Taking action for:", actionId);
  };

  return (
    <div className="max-h-96 overflow-auto rounded-lg bg-white shadow">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Recommended Actions
        </h2>
        <div className="space-y-4">
          {actions.length > 0 ? (
            actions.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                onTakeAction={handleTakeAction}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No recommended actions at this time
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
