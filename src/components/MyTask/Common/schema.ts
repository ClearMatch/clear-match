import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

export const taskSchema = z.object({
  contact_id: z.string().min(1, "Contact is required"),
  organization_id: z.string().optional(),
  type: z.string().min(1, "Activity type is required"),
  subject: z.string().optional(),
  content: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  status: z.string().default("todo"),
  due_date: z
    .string()
    .min(1, "Due date is required")
    .refine((date) => {
      if (!date) return false;
      return new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0));
    }, "Due date cannot be in the past"),
  event_id: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: z.string().default("1"),
  job_posting_id: z.string().optional(),
});

export type TaskSchema = z.infer<typeof taskSchema>;

export function useTaskForm() {
  const form = useForm<TaskSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      contact_id: "",
      organization_id: "",
      type: "",
      subject: "",
      content: "",
      description: "",
      status: "todo",
      due_date: "",
      event_id: "",
      assigned_to: "",
      priority: "1",
      job_posting_id: "",
    },
  });

  return form;
}
