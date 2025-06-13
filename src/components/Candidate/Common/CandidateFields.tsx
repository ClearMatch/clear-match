import CheckboxField from "./CheckBoxField";
import {
  companySizeOptions,
  employmentStatusOptions,
  locationPreferenceOptions,
  relationshipOptions,
  urgencyOptions,
} from "./constants";
import { useUserForm } from "./schema";
import SelectField from "./SelectField";
import TextInputField from "./TextInputField";

function CandidateFields({ form }: { form: ReturnType<typeof useUserForm> }) {
  return (
    <>
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
          name="relationship_type"
          label="Relationship Type"
          placeholder="Select a Relationship"
          options={relationshipOptions}
          required
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

export default CandidateFields;
