"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import TextInputField from "@/components/Candidate/Common/TextInputField";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";
import useSWRMutation from "swr/mutation";
import {
  activityTypeOptions,
  priorityOptions,
  statusOptions,
} from "@/components/MyTask/Common/constants";
import DateField from "@/components/MyTask/Common/DateField";
import { TaskSchema, useTaskForm } from "@/components/MyTask/Common/schema";
import SelectField from "@/components/MyTask/Common/SelectField";
import TextAreaField from "@/components/MyTask/Common/TextAreaField";
import { insertTask } from "@/components/MyTask/Services/taskService";

interface AddTaskFormProps {
  candidateId: string;
  candidateName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function AddTaskForm({
  candidateId,
  candidateName,
  onSuccess,
  onCancel,
}: AddTaskFormProps) {
  const form = useTaskForm();
  const { toast } = useToast();
  const auth = useAuth();
  const { trigger, isMutating } = useSWRMutation("activities", insertTask);

  // Set the contact_id in the form when component mounts
  useMemo(() => {
    form.setValue("contact_id", candidateId);
  }, [candidateId, form]);

  const onSubmit = async (data: TaskSchema) => {
    if (!data.type) {
      toast({
        title: "Error",
        description: "Please select an activity type",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure contact_id and userId are set
      // Ensure we have a valid user ID
      if (!auth.user?.id) {
        toast({
          title: "Error",
          description: "Authentication required to create task",
          variant: "destructive",
        });
        return;
      }

      const taskData = {
        ...data,
        contact_id: candidateId,
        userId: auth.user.id,
      };

      await trigger(taskData);

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add New Task</h3>
        <p className="text-sm text-gray-600 mt-1">
          Creating task for: <span className="font-medium text-gray-900">{candidateName}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              control={form.control}
              name="type"
              label="Activity Type"
              placeholder="Select activity type"
              options={activityTypeOptions}
              required
            />

            <SelectField
              control={form.control}
              name="priority"
              label="Priority Level"
              placeholder="Select priority"
              options={priorityOptions}
              required
            />
          </div>

          <TextInputField
            control={form.control}
            name="description"
            label="Task Description"
            placeholder="Enter task description"
            required
          />

          <TextAreaField
            control={form.control}
            name="content"
            label="Task Details"
            placeholder="Enter additional details about this task..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateField
              control={form.control}
              name="due_date"
              label="Due Date"
              required
            />

            <SelectField
              control={form.control}
              name="status"
              label="Status"
              placeholder="Select status"
              options={statusOptions}
              required
            />
          </div>

          <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isMutating}
                className="w-32"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isMutating}
              className="bg-black text-white w-32 hover:bg-gray-800"
            >
              {isMutating ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default AddTaskForm;