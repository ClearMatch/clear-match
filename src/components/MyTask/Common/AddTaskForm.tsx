"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import useSWRMutation from "swr/mutation";
import { Entity, Event, Organization } from "../AddTask/Types";
import TaskFields from "../Common/TaskFields";
import { TaskSchema, useTaskForm } from "../Common/schema";
import { insertTask } from "../Services/taskService";

interface AddTaskFormProps {
  contacts: Entity[];
  organizations: Organization[];
  users: Entity[];
  events: Event[];
  isLoading?: boolean;
}

export function AddTaskForm({
  contacts,
  organizations,
  users,
  events,
  isLoading = false,
}: AddTaskFormProps) {
  const form = useTaskForm();
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const { trigger, isMutating } = useSWRMutation("activities", insertTask);

  const onSubmit = async (data: TaskSchema) => {
    if (!data.contact_id) {
      toast({
        title: "Error",
        description: "Please select a contact",
        variant: "destructive",
      });
      return;
    }

    if (!data.type) {
      toast({
        title: "Error",
        description: "Please select an activity type",
        variant: "destructive",
      });
      return;
    }

    if (!auth.user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      await trigger({
        ...data,
        userId: auth.user.id,
      });

      toast({
        title: "Success",
        description: "Activity added successfully.",
      });
      form.reset();
      router.push("/task");
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h1 className="font-bold text-md mb-4">Add Task</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TaskFields
            form={form}
            contacts={contacts}
            organizations={organizations}
            users={users}
            events={events}
            isLoading={isLoading}
          />
          <hr className="color-black" />
          <div className="flex justify-center space-x-8 pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-40"
              onClick={() => router.push("/task")}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              className="bg-black text-white w-40"
              type="submit"
              disabled={isMutating || isLoading}
            >
              {isMutating ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
