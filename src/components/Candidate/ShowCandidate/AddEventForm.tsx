"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";
import useSWRMutation from "swr/mutation";
import { insertEvent } from "@/components/Event/Services/eventService";
import { EventSchema, useEventForm } from "@/components/Event/Common/schema";
import SelectField from "@/components/Event/Common/SelectField";
import { eventTypes } from "@/components/Event/Common/constants";

interface AddEventFormProps {
  candidateId: string;
  candidateName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function AddEventForm({
  candidateId,
  candidateName,
  onSuccess,
  onCancel,
}: AddEventFormProps) {
  const form = useEventForm();
  const { toast } = useToast();
  const auth = useAuth();
  const { trigger, isMutating } = useSWRMutation("events", insertEvent);

  // Set the contact_id in the form when component mounts
  useMemo(() => {
    form.setValue("contact_id", candidateId);
  }, [candidateId, form]);

  const onSubmit = async (data: EventSchema) => {
    if (!data.type) {
      toast({
        title: "Error",
        description: "Please select an event type",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure we have a valid user ID
      if (!auth.user?.id) {
        toast({
          title: "Error",
          description: "Authentication required to create event",
          variant: "destructive",
        });
        return;
      }

      const eventData = {
        ...data,
        contact_id: candidateId,
        userId: auth.user.id,
      };

      await trigger(eventData);

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add New Event</h3>
        <p className="text-sm text-gray-600 mt-1">
          Creating event for: <span className="font-medium text-gray-900">{candidateName}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <SelectField
              control={form.control}
              name="type"
              label="Event Type"
              placeholder="Select event type"
              options={eventTypes}
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
              {isMutating ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default AddEventForm;