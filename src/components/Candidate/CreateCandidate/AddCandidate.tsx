"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import useSWRMutation from "swr/mutation";
import CandidateFields from "../Common/CandidateFields";
import { Schema, useUserForm } from "../Common/schema";

function AddCandidate() {
  const form = useUserForm();
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();

  async function insertCandidate(url: string, { arg }: { arg: Schema }) {
    const { error } = await supabase.from(url).insert({
      ...arg,
      past_company_sizes: [arg.past_company_sizes],
      created_by: auth.user?.id,
    });
    if (error) throw new Error(error.message);
  }

  const { trigger, isMutating } = useSWRMutation("contacts", insertCandidate);

  const onSubmit = async (data: Schema) => {
    try {
      await trigger(data);
      toast({
        title: "Success",
        description: "Candidate added successfully.",
      });
      form.reset();
      router.push("/contacts");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 bg-white">
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <h1 className="font-bold text-md mb-4">Add Candidate</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CandidateFields form={form} />
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

export default AddCandidate;
