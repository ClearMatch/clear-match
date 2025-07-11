import { useUserForm } from "./schema";
import TextInputField from "./TextInputField";
import SelectField from "./SelectField";
import { 
  companySizeOptions, 
  relationshipOptions, 
  locationPreferenceOptions 
} from "./constants";

interface ProfessionalInfoFieldsProps {
  form: ReturnType<typeof useUserForm>;
  contactId?: string;
}

export default function ProfessionalInfoFields({ form, contactId }: ProfessionalInfoFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <TextInputField
          control={form.control}
          name="current_job_title"
          label="Current Job Title"
          placeholder="Enter current job title"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TextInputField
          control={form.control}
          name="current_company"
          label="Current Company"
          placeholder="Enter current company"
          required
        />
        <SelectField
          control={form.control}
          name="contact_type"
          label="Contact Type"
          placeholder="Select a Relationship"
          options={relationshipOptions}
          required
          key={`contact_type_${contactId}_${form.watch('contact_type')}`}
        />
        <SelectField
          control={form.control}
          name="workplace_preferences"
          label="Location Preference"
          placeholder="Select a Location Preference"
          options={locationPreferenceOptions}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TextInputField
          control={form.control}
          name="compensation_expectations"
          label="Base Salary Expectation In Dollars"
          type="number"
          placeholder="Enter base salary expectation"
        />
        <SelectField
          control={form.control}
          name="current_company_size"
          label="Current Company Size"
          placeholder="Select Company Size"
          options={companySizeOptions}
          required
        />
        <SelectField
          control={form.control}
          name="past_company_sizes"
          label="Past Company Size"
          placeholder="Select Company Size"
          options={companySizeOptions}
          required
        />
      </div>
    </>
  );
}