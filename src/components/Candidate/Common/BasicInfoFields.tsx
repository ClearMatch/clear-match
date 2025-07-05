import { useUserForm } from "./schema";
import TextInputField from "./TextInputField";

interface BasicInfoFieldsProps {
  form: ReturnType<typeof useUserForm>;
}

export default function BasicInfoFields({ form }: BasicInfoFieldsProps) {
  return (
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
  );
}