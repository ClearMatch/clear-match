"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Entity, Organization } from "../AddEvent/Types";
import { insertEvent } from "../Services/eventService";
import EventFields from "./EventFields";
import { EventSchema, useEventForm } from "./schema";
import { errorHandlers } from "@/lib/error-handling";
import { queryKeyUtils } from "@/lib/query-keys";

interface AddEventFormProps {
  candidates: Entity[];
  organizations: Organization[];
  isLoading?: boolean;
}

export const AddEventForm = memo(function AddEventForm({
  candidates,
  organizations,
  isLoading = false,
}: AddEventFormProps) {
  const form = useEventForm();
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { mutate: trigger, isPending: isMutating } = useMutation({
    mutationFn: (data: EventSchema & { userId: string }) => insertEvent("", { arg: data }),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Event added successfully.",
      });
      form.reset();
      
      // Use enhanced cache invalidation with operation type and related data
      queryKeyUtils.invalidateRelatedData(queryClient, {
        eventId: data?.[0]?.id,
        contactId: form.getValues('contact_id'),
        userId: auth.user?.id,
        operationType: 'create',
      });
      
      router.push("/event");
    },
    onError: (error) => {
      const errorMessage = errorHandlers.event.create(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = useCallback(
    async (data: EventSchema) => {
      if (!data.contact_id) {
        toast({
          title: "Error",
          description: "Please select a contact",
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

      trigger({
        ...data,
        userId: auth.user.id,
      });
    },
    [trigger, auth.user?.id, toast]
  );

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h1 className="font-bold text-md mb-4" id="add-event-title">Add Event</h1>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isLoading ? "Loading form data..." : "Form ready"}
        {isMutating ? "Submitting event..." : ""}
      </div>
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-6"
          aria-labelledby="add-event-title"
          noValidate
        >
          <EventFields
            form={form}
            candidates={candidates}
            organizations={organizations}
            isLoading={isLoading}
          />
          <hr className="border-gray-300" />
          <div className="flex justify-center space-x-8 pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-40"
              onClick={() => router.push("/event")}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              className="bg-black text-white w-40 hover:bg-gray-800"
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
});
