"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWRMutation from "swr/mutation";
import { TaskSchema, useTaskForm } from "../Common/schema";
import TaskFields from "../Common/TaskFields";
import { ActivityData } from "../Services/Types";
import { useTaskData } from "../Services/useTaskData";
import { supabase } from "@/lib/supabase";

interface Props {
  data: ActivityData;
  selectId: string;
}

function EditForm({ data, selectId }: Props) {
  const form = useTaskForm();
  const { candidates, organizations, users } = useTaskData();
  const route = useRouter();

  useEffect(() => {
    if (
      data &&
      candidates.length > 0 &&
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
  }, [data, candidates, organizations, form, users]);

  async function updateActivity(
    url: string,
    { arg }: { arg: { selectId: string; formData: TaskSchema } }
  ) {
    try {
      console.log("Updating task with ID:", arg.selectId);
      console.log("Form data:", arg.formData);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("You must be logged in to update tasks");
      }
      
      console.log("Authenticated as user:", session.user.id);
      
      // Get the user's organization_id
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();
        
      if (profileError || !profileData) {
        throw new Error("Failed to get user profile");
      }
      
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
        organization_id: profileData.organization_id
      };
      
      console.log("Update data:", updateData);
      
      // Update the task directly using Supabase
      const { data, error } = await supabase
        .from("activities")
        .update(updateData)
        .eq("id", arg.selectId)
        .eq("organization_id", profileData.organization_id) // Ensure user can only update tasks in their org
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

  const { trigger, isMutating } = useSWRMutation("activities", updateActivity);

  const onSubmit = async (formData: TaskSchema) => {
    try {
      await trigger({ selectId, formData });
      route.push("/task");
      toast({
        title: "Task updated successfully",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Update failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TaskFields
            form={form}
            candidates={candidates}
            organizations={organizations}
            users={users}
          />
          <hr className="color-black" />
          <div className="flex justify-center space-x-8 pt-6">
            <Button
              variant="outline"
              className="w-40"
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
