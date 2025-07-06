import { useUserForm } from "./schema";
import TextInputField from "./TextInputField";

interface ContactInfoFieldsProps {
  form: ReturnType<typeof useUserForm>;
}

export default function ContactInfoFields({ form }: ContactInfoFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TextInputField
          control={form.control}
          name="work_email"
          label="Work email"
          required
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
          name="other_social_urls"
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
    </>
  );
}