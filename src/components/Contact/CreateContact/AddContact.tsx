"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { errorHandlers } from "@/lib/error-handling";
import { queryKeyUtils } from "@/lib/query-keys";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { ContactDataTransformer, DetailedError } from "@/lib/data-transformers";
import ContactFields from "../Common/ContactFields";
import { Schema, useUserForm } from "../Common/schema";

function AddContact() {
  const form = useUserForm();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  async function insertContact(data: Schema) {
    try {
      // Validate user authentication
      if (!user?.id) {
        throw new DetailedError("User authentication is required to create contacts", {
          operation: "create",
          field: "created_by",
        });
      }

      // Get user profile data from the API
      const profileResponse = await fetch('/api/profile');
      if (!profileResponse.ok) {
        throw new DetailedError("Failed to get user profile", {
          operation: "create",
          field: "organization_id",
        });
      }
      
      const profile = await profileResponse.json();
      if (!profile.organization_id) {
        throw new DetailedError("Organization context is required to create contacts", {
          operation: "create",
          field: "organization_id",
        });
      }

      // Use centralized data transformer
      const insertData = {
        ...ContactDataTransformer.forCreate(data),
        organization_id: profile.organization_id,
        created_by: user.id,
      };

      const { error } = await supabase.from("contacts").insert(insertData);
      
      if (error) {
        throw new DetailedError(error.message, {
          operation: "create",
          formData: Object.keys(data),
        });
      }
    } catch (error) {
      // Re-throw with additional context if it's not already a DetailedError
      if (error instanceof DetailedError) {
        throw error;
      }
      throw new DetailedError(
        error instanceof Error ? error.message : "Unknown error occurred",
        { operation: "create" }
      );
    }
  }

  const { mutate: trigger, isPending: isMutating, isSuccess, isError, error } = useMutation({
    mutationFn: insertContact,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact added successfully.",
      });
      form.reset();
      
      // Invalidate contacts list to show new contact immediately
      queryClient.invalidateQueries({ queryKey: ["contacts", "list"] });
      
      // Also invalidate dashboard stats
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["dashboard", "stats", user.id] });
      }
      
      router.push("/contacts");
    },
    onError: (error) => {
      const errorMessage = errorHandlers.contact.create(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Performance monitoring for contact creation
  usePerformanceMonitor({
    queryKey: 'contact_create',
    operation: 'mutation',
    isLoading: isMutating,
    isSuccess,
    isError,
    error,
    threshold: 1500, // 1.5 seconds threshold for contact creation
  });

  const onSubmit = async (data: Schema) => {
    trigger(data);
  };

  return (
    <div className="p-4 bg-white">
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <h1 className="font-bold text-md mb-4">Add Contact</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ContactFields form={form} />
            <hr className="color-black" />
            <div className="flex justify-center space-x-8 pt-6">
              <Button
                type="button"
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
                {isMutating ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default AddContact;
