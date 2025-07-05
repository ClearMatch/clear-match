"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWRMutation from "swr/mutation";
import CandidateFields from "../Common/CandidateFields";
import { Schema, useUserForm } from "../Common/schema";
import { Candidate } from "./Types";

interface Props {
  data: Candidate;
  id: string;
}

function EditForm({ data, id }: Props) {
  const form = useUserForm();
  const auth = useAuth();
  const router = useRouter();

  async function updateCandidate(
    _: string,
    { arg }: { arg: { id: string; formData: Schema } }
  ) {
    const { error } = await supabase
      .from("candidates")
      .update({ ...arg.formData, updated_by: auth.user?.id })
      .eq("id", arg.id);

    if (error) throw new Error(error.message);
  }

  const { trigger, isMutating } = useSWRMutation(
    "update-candidate",
    updateCandidate
  );
  useEffect(() => {
    if (data) {
      form.reset({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        personal_email: data.personal_email || "",
        work_email: data.work_email || "",
        phone: data.phone || "",
        linkedin_url: data.linkedin_url || "",
        github_url: data.github_url || "",
        other_social_urls: data.other_social_urls || "",
        resume_url: data.resume_url || "",
        functional_role: data.functional_role || "",
        current_location: data.current_location || "",
        current_job_title: data.current_job_title || "",
        current_company: data.current_company || "",
        current_company_size: data.current_company_size || "",
        relationship_type: data.relationship_type || "",
        workplace_preferences: data.workplace_preferences || "",
        compensation_expectations: data.compensation_expectations || "",
        visa_requirements: data.visa_requirements || false,
        past_company_sizes: data.past_company_sizes || "",
        urgency_level: data.urgency_level || "",
        employment_status: data.employment_status || "",
      });
    }
  }, [data, form]);

  const onSubmit = async (formData: Schema) => {
    try {
      await trigger({ id, formData });
      toast({
        title: "Candidate updated successfully",
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CandidateFields form={form} />
        <hr className="color-black" />
        <div className="flex justify-center space-x-8 pt-6">
          <Button
            variant="outline"
            className="w-40"
            onClick={() => router.push("/candidates")}
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
