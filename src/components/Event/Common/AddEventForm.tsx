"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import useSWRMutation from "swr/mutation";
import { Entity, Organization } from "../AddEvent/Types";
import { insertEvent } from "../Services/eventService";
import EventFields from "./EventFields";
import { EventSchema, useEventForm } from "./schema";

interface AddEventFormProps {
  candidates: Entity[];
  organizations: Organization[];
  isLoading?: boolean;
}

export function AddEventForm({
  candidates,
  organizations,
  isLoading = false,
}: AddEventFormProps) {
  const form = useEventForm();
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const { trigger, isMutating } = useSWRMutation("events", insertEvent);

  const onSubmit = async (data: EventSchema) => {
    console.log("Form submitted with data:", data);

    // Validate required fields
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

    try {
      await trigger({
        ...data,
        userId: auth.user.id,
      });

      toast({
        title: "Success",
        description: "Event added successfully.",
      });
      form.reset();
      router.push("/event");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h1 className="font-bold text-md mb-4">Add Event</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <EventFields
            form={form}
            candidates={candidates}
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
