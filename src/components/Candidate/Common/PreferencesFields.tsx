import { useUserForm } from "./schema";
import SelectField from "./SelectField";
import CheckboxField from "./CheckBoxField";
import { 
  urgencyOptions, 
  employmentStatusOptions 
} from "./constants";

interface PreferencesFieldsProps {
  form: ReturnType<typeof useUserForm>;
}

export default function PreferencesFields({ form }: PreferencesFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SelectField
          control={form.control}
          name="urgency_level"
          label="Level of Urgency"
          placeholder="Select Urgency Level"
          options={urgencyOptions}
          required
        />
        <SelectField
          control={form.control}
          name="employment_status"
          label="Employment Status"
          placeholder="Select Employment Status"
          options={employmentStatusOptions}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CheckboxField
          control={form.control}
          name="visa_requirements"
          label="Visa Requirement"
          required
        />
      </div>
    </>
  );
}