"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskSchema, useTaskForm } from "../Common/schema";
import TaskFields from "../Common/TaskFields";
import { ActivityData } from "../Services/Types";
import { useTaskData } from "../Services/useTaskData";
import { supabase } from "@/lib/supabase";
import { errorHandlers } from "@/lib/error-handling";
import { queryKeyUtils } from "@/lib/query-keys";
import { useOrganizationAuth } from "@/hooks";

interface Props {
  data: ActivityData;
  selectId: string;
}

function EditForm({ data, selectId }: Props) {
  const form = useTaskForm();
  const { contacts, organizations, users, events } = useTaskData();
  const route = useRouter();
  const { getOrganizationAuth } = useOrganizationAuth();

  useEffect(() => {
    if (
      data &&
      contacts.length > 0 &&
      organizations.length > 0 &&
      users.length > 0
    ) {
      form.reset({
        type: data.type || "",
        description: data.description || "",
        due_date: data.due_date || "",
        status: data.status || "",
        event_id: data.event_id || "",
        job_posting_id: data.job_posting_id || "",
        contact_id: data.contact_id || "",
        organization_id: data.organization_id || "",
        subject: data.subject || "",
        content: data.content || "",
        assigned_to: data.assigned_to || "",
        priority: String(data.priority),
      });
    }
  }, [data, contacts, organizations, form, users, events]);

  async function updateActivity(
    url: string,
    { arg }: { arg: { selectId: string; formData: TaskSchema } }
  ) {
    try {
      console.log("Updating task with ID:", arg.selectId);
      console.log("Form data:", arg.formData);

      // Get authenticated user and organization context
      const { userId, organizationId } = await getOrganizationAuth();

      // Build update data
      const updateData: {
        description: string;
        type: string;
        due_date: string | null;
        status: string;
        priority: number;
        contact_id: string | null;
        subject: string;
        content: string;
        assigned_to: string | null;
        event_id: string | null;
        job_posting_id: string | null;
        organization_id: string;
      } = {
        description: arg.formData.description,
        type: arg.formData.type,
        due_date: arg.formData.due_date || null,
        status: arg.formData.status,
        priority: Number(arg.formData.priority),
        contact_id: arg.formData.contact_id || null,
        subject: arg.formData.subject || "",
        content: arg.formData.content || "",
        assigned_to: arg.formData.assigned_to || null,
        event_id: arg.formData.event_id || null,
        job_posting_id: arg.formData.job_posting_id || null,
        organization_id: organizationId,
      };

      // Update the task directly using Supabase
      const { data, error } = await supabase
        .from("activities")
        .update(updateData)
        .eq("id", arg.selectId)
        .eq("organization_id", organizationId) // Ensure user can only update tasks in their org
        .select()
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        throw new Error(error.message || "Failed to update task");
      }

      console.log("Task updated successfully:", data);
      return data;
    } catch (error) {
      console.error("Update activity error:", error);
      throw error;
    }
  }

  const queryClient = useQueryClient();
  const { mutate: trigger, isPending: isMutating } = useMutation({
    mutationFn: ({
      selectId,
      formData,
    }: {
      selectId: string;
      formData: TaskSchema;
    }) => updateActivity("", { arg: { selectId, formData } }),
    onSuccess: (updatedTask) => {
      toast({ title: "Task updated successfully" });

      // Use enhanced cache invalidation with operation type and related data
      queryKeyUtils.invalidateRelatedData(queryClient, {
        taskId: selectId,
        contactId: updatedTask?.contact_id,
        userId: updatedTask?.assigned_to,
        operationType: "update",
      });

      // Force refetch TaskPriority counts for dashboard
      queryClient.refetchQueries({ 
        queryKey: ["taskPriorityCounts"],
        type: "all" // Refetch all matching queries regardless of state
      });

      route.push("/task");
    },
    onError: (error) => {
      const errorMessage = errorHandlers.task.update(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (formData: TaskSchema) => {
    if (!formData.due_date) {
      toast({
        title: "Error",
        description: "Please select a due date",
        variant: "destructive",
      });
      return;
    }
    trigger({ selectId, formData });
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TaskFields
            form={form}
            contacts={contacts}
            organizations={organizations}
            users={users}
            events={events}
          />
          <hr className="color-black" />
          <div className="flex justify-center space-x-8 pt-6">
            <Button
              variant="outline"
              className="w-40"
              type="button"
              onClick={() => route.push("/task")}
            >
              Cancel
            </Button>
            <Button
              className="bg-black text-white w-40"
              type="submit"
              disabled={isMutating}
            >
              {isMutating ? "Updating..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default EditForm;
