import { useUserForm } from "./schema";
import BasicInfoFields from "./BasicInfoFields";
import ContactInfoFields from "./ContactInfoFields";
import ProfessionalInfoFields from "./ProfessionalInfoFields";
import PreferencesFields from "./PreferencesFields";

function CandidateFields({ form }: { form: ReturnType<typeof useUserForm> }) {
  return (
    <>
      <BasicInfoFields form={form} />
      <ContactInfoFields form={form} />
      <ProfessionalInfoFields form={form} />
      <PreferencesFields form={form} />
    </>
  );
}

export default CandidateFields;