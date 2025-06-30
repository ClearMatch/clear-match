import { supabase } from "@/lib/supabase";
import { TaskSchema } from "../Common/schema";

export async function insertTask(
  url: string,
  { arg }: { arg: TaskSchema & { userId: string } }
) {
  const taskData = {
    candidate_id: arg.candidate_id,
    organization_id: arg.organization_id || null,
    type: arg.type,
    subject: arg.subject || null,
    content: arg.content || null,
    description: arg.description || null,
    status: arg.status || "todo",
    due_date: arg.due_date || null,
    event_id: arg.event_id || null,
    assigned_to: arg.assigned_to || null,
    priority: arg.priority,
    job_posting_id: arg.job_posting_id || null,
    metadata: null,
    created_at: new Date().toISOString().replace("Z", "+00:00"),
    created_by: arg.userId,
  };

  console.log("Task data to insert:", taskData);

  const { data, error } = await supabase
    .from("activities")
    .insert(taskData)
    .select();

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message);
  }

  console.log("Successfully inserted:", data);
  return data;
}
