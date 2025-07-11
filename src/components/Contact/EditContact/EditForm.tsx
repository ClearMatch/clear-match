"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorHandlers } from "@/lib/error-handling";
import { queryKeyUtils } from "@/lib/query-keys";
import { ContactDataTransformer, DetailedError } from "@/lib/data-transformers";
import ContactFields from "../Common/ContactFields";
import { Schema, useUserForm } from "../Common/schema";
import { Contact } from "./Types";

interface Props {
  data: Contact;
  id: string;
}

function EditForm({ data, id }: Props) {
  const form = useUserForm();
  const auth = useAuth();
  const router = useRouter();

  const queryClient = useQueryClient();

  async function updateContact({ id, formData }: { id: string; formData: Schema }) {
    try {
      // Use centralized data transformer
      const updateData = ContactDataTransformer.forUpdate(formData, auth.user?.id);

      const { error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", id);

      if (error) {
        throw new DetailedError(error.message, {
          contactId: id,
          operation: "update",
          formData: Object.keys(formData),
        });
      }
    } catch (error) {
      // Re-throw with additional context if it's not already a DetailedError
      if (error instanceof DetailedError) {
        throw error;
      }
      throw new DetailedError(
        error instanceof Error ? error.message : "Unknown error occurred",
        { contactId: id, operation: "update" }
      );
    }
  }

  const { mutate: trigger, isPending: isMutating } = useMutation({
    mutationFn: updateContact,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact updated successfully.",
      });
      
      // Use enhanced cache invalidation with operation type and related data
      queryKeyUtils.invalidateRelatedData(queryClient, {
        contactId: id,
        userId: auth.user?.id,
        operationType: 'update',
      });
      
      router.push("/contacts");
    },
    onError: (error) => {
      const errorMessage = errorHandlers.contact.update(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  useEffect(() => {
    if (data) {
      // Use centralized data transformer for consistent form loading
      const formData = ContactDataTransformer.forForm(data);
      form.reset(formData);
    }
  }, [data]);

  const onSubmit = async (formData: Schema) => {
    trigger({ id, formData });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ContactFields form={form} contactId={id} />
        <hr className="color-black" />
        <div className="flex justify-center space-x-8 pt-6">
          <Button
            variant="outline"
            className="w-40"
            onClick={() => router.push("/contacts")}
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
  );
}

export default EditForm;
