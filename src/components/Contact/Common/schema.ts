import * as z from "zod";

const optionalUrl = z
  .string()
  .transform((val) => (val === "" ? undefined : val))
  .optional()
  .refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Invalid URL",
  });

export const schema = z.object({
  first_name: z.string().min(1, "first name is required"),
  last_name: z.string().min(1, "last name is required"),
  personal_email: z.string().email("Invalid email address"),
  work_email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(1, "phone no is required"),
  linkedin_url: optionalUrl,
  github_url: optionalUrl,
  other_social_urls: optionalUrl,
  resume_url: optionalUrl,
  functional_role: z.string().optional(),
  current_location: z.string().min(1, "Current location is required"),
  current_job_title: z.string().optional(),
  current_company: z.string().optional(),
  current_company_size: z.string().optional(),
  contact_type: z.enum(["candidate", "client", "both"], {
    errorMap: () => ({ message: "Contact type is required" }),
  }),
  workplace_preferences: z.string().optional(),
  compensation_expectations: z.string().optional(),
  visa_requirements: z.boolean().optional(),
  past_company_sizes: z.string().optional(),
  urgency_level: z.string().optional(),
  employment_status: z.string().optional(),
});

export type Schema = z.infer<typeof schema>;

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export function useUserForm(defaultValues?: Partial<Schema>) {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      first_name: "",
      last_name: "",
      personal_email: "",
      work_email: "",
      phone: "",
      linkedin_url: "",
      github_url: "",
      other_social_urls: "",
      resume_url: "",
      functional_role: "",
      current_location: "",
      current_job_title: "",
      current_company: "",
      current_company_size: "",
      contact_type: "candidate",
      workplace_preferences: "",
      compensation_expectations: "",
      visa_requirements: false,
      past_company_sizes: "",
      urgency_level: "",
      employment_status: "",
    },
  });

  return form;
}
