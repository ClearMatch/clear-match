import { ActivityWithRelations } from "../Services/Types";

/**
 * Sort tasks by priority level (4=Critical, 3=High, 2=Medium, 1=Low)
 */
export function sortTasksByPriority(
  tasks: ActivityWithRelations[]
): ActivityWithRelations[] {
  return [...tasks].sort((a, b) => {
    // Sort by priority first (higher priority first)
    const priorityA = a.priority || 1;
    const priorityB = b.priority || 1;

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // Then by due date
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }

    // Finally by creation date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Group tasks by priority level for filtering
 */
export function groupTasksByPriority(tasks: ActivityWithRelations[]) {
  const groups = {
    critical: [] as ActivityWithRelations[], // Priority 4
    high: [] as ActivityWithRelations[], // Priority 3
    medium: [] as ActivityWithRelations[], // Priority 2
    low: [] as ActivityWithRelations[], // Priority 1
  };

  tasks.forEach((task) => {
    const priority = task.priority || 1;

    if (priority === 4) groups.critical.push(task);
    else if (priority === 3) groups.high.push(task);
    else if (priority === 2) groups.medium.push(task);
    else groups.low.push(task);
  });

  return groups;
}
