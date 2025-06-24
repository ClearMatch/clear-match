import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export const taskSchema = z.object({
  candidate_id: z.string().min(1, "Contact is required"),
  organization_id: z.string().optional(),
  type: z.string().min(1, "Activity type is required"),
  subject: z.string().optional(),
  content: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  status: z.string().default("todo"),
  due_date: z.string().optional(), // Using string for date input
  event_id: z.string().optional(), // Changed to string to match form input
  assigned_to: z.string().optional(),
  priority: z.string().optional(), // Changed to string to match select options
  job_posting_id: z.string().optional(),
});

export type TaskSchema = z.infer<typeof taskSchema>;

export function useTaskForm() {
  const form = useForm<TaskSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      candidate_id: "",
      organization_id: "",
      type: "",
      subject: "",
      content: "",
      description: "",
      status: "todo",
      due_date: "",
      event_id: "",
      assigned_to: "",
      priority: "",
      job_posting_id: "",
    },
  });

  return form;
}
