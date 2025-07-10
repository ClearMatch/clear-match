"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { errorHandlers } from "@/lib/error-handling";
import { queryKeyUtils } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import EventFields from "../Common/EventFields";
import { EventSchema, useEventForm } from "../Common/schema";
import { EventData } from "../Services/Types";
import { useEventData } from "../Services/useEventData";

interface Props {
  data: EventData;
  selectId: string;
}

function EditEventForm({ data, selectId }: Props) {
  const form = useEventForm();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const { contact, organizations, isLoading } = useEventData();

  async function updateEvent({
    id,
    formData,
  }: {
    id: string;
    formData: EventSchema;
  }) {
    const { error } = await supabase
      .from("events")
      .update({ ...formData })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  const { mutate: trigger, isPending: isMutating } = useMutation({
    mutationFn: ({
      selectId,
      formData,
    }: {
      selectId: string;
      formData: EventSchema;
    }) => updateEvent({ id: selectId, formData }),

    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully.",
      });

      queryKeyUtils.invalidateRelatedData(queryClient, {
        eventId: selectId,
        contactId: form.getValues("contact_id"),
        userId: auth.user?.id,
        operationType: "update",
      });

      router.push("/event");
    },
    onError: (error) => {
      const errorMessage =
        errorHandlers.event.update?.(error) ||
        (error instanceof Error ? error.message : "Something went wrong");

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (data) {
      const formData = {
        contact_id: data.contact_id || "",
        organization_id: data.organization_id || "",
        type: data.type || "",
      };
      form.reset(formData);
    }
  }, [data, form]);

  const onSubmit = async (formData: EventSchema) => {
    const requiredFields = [
      { field: formData.contact_id, name: "contact" },
      { field: formData.organization_id, name: "organization" },
      { field: formData.type, name: "event type" },
    ];

    const missingField = requiredFields.find(({ field }) => !field);
    if (missingField) {
      toast({
        title: "Error",
        description: `Please select a ${missingField.name}`,
        variant: "destructive",
      });
      return;
    }

    trigger({ selectId, formData });
  };

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <EventFields
              form={form}
              contact={contact}
              organizations={organizations}
              isLoading={isLoading}
            />
            <hr className="color-black" />
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
                className="bg-black text-white w-40"
                type="submit"
                disabled={isMutating}
              >
                {isMutating ? "Updating..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

export default EditEventForm;
