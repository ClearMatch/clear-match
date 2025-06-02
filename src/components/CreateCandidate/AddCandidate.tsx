"use client";

import { Form } from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Schema, useUserForm } from "./schema";
import TextInputField from "./TextInputField";

interface Props {
  onClose: () => void;
  setRefetchCandidate: (value: boolean) => void;
}

export default function MyFormComponent({
  onClose,
  setRefetchCandidate,
}: Props) {
  const form = useUserForm();
  const { toast } = useToast();
  const onSubmit = async (data: Schema) => {
    const { error } = await supabase.from("candidates").insert(data);
    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
      });
      setRefetchCandidate(true);
      onClose();
    } else {
      toast({
        title: "Success",
        variant: "destructive",
      });
      setRefetchCandidate(true);
      onClose();
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TextInputField
            control={form.control}
            name="first_name"
            label="First name"
            placeholder="Enter first name"
            required
          />
          <TextInputField
            control={form.control}
            name="last_name"
            label="Last name"
            placeholder="Enter last name"
            required
          />
          <TextInputField
            control={form.control}
            name="personal_email"
            label="Personal email"
            placeholder="clear@gmail.com"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TextInputField
            control={form.control}
            name="work_email"
            label="Work email"
            placeholder="Enter work email"
          />
          <TextInputField
            control={form.control}
            name="phone"
            label="Phone number"
            placeholder="+1 415 555 2671"
            required
          />
          <TextInputField
            control={form.control}
            name="linkedin_url"
            label="LinkedIn URL"
            placeholder="https://www.linkedin.com/in/username/"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TextInputField
            control={form.control}
            name="github_url"
            label="Github URL"
            placeholder="https://www.github.com/in/username/"
          />
          <TextInputField
            control={form.control}
            name="other_social_url"
            label="Other social URL"
            placeholder="https://www.facebook.com/in/username/"
          />
          <TextInputField
            control={form.control}
            name="resume_url"
            label="Resume URL"
            placeholder="https://www.example.com/resume.pdf"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TextInputField
            control={form.control}
            name="resume_url"
            label="Resume URL"
            placeholder="https://www.drive.com/in/username/"
          />
          <TextInputField
            control={form.control}
            name="functional_role"
            label="Functional Role"
            placeholder="Enter functional role"
          />
          <TextInputField
            control={form.control}
            name="current_location"
            required
            label="Current Location"
            placeholder="Enter current location"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TextInputField
            control={form.control}
            name="current_job_title"
            label="Current Job Title"
            placeholder="Enter current job title"
          />
          <TextInputField
            control={form.control}
            name="current_company"
            label="Current Company"
            placeholder="Enter current company"
            required
          />
          <TextInputField
            control={form.control}
            name="current_company_size"
            label="Current Company Size"
            placeholder="Enter current company size"
          />
        </div>
        <hr className="color-black" />
        <div className="flex justify-center space-x-8 pt-6">
          <Button onClick={onClose} variant="outline" className="w-40">
            Cancel
          </Button>
          <Button className="bg-black text-white w-40" type="submit">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}
