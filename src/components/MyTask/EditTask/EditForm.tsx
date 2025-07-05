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
        candidate_id: data.candidate_id || "",
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
    const response = await fetch(`/api/tasks/${arg.selectId}`, {
      method: "PUT",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...arg.formData,
        priority: Number(arg.formData.priority),
        event_id: arg.formData.event_id || null,
        job_posting_id: arg.formData.job_posting_id || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to update task`);
    }

    return response.json();
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Update failed",
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
