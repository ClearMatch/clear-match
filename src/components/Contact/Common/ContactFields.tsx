import { useUserForm } from "./schema";
import BasicInfoFields from "./BasicInfoFields";
import ContactInfoFields from "./ContactInfoFields";
import ProfessionalInfoFields from "./ProfessionalInfoFields";
import PreferencesFields from "./PreferencesFields";

function ContactFields({ form, contactId }: { form: ReturnType<typeof useUserForm>; contactId?: string }) {
  return (
    <>
      <BasicInfoFields form={form} />
      <ContactInfoFields form={form} />
      <ProfessionalInfoFields form={form} contactId={contactId} />
      <PreferencesFields form={form} />
    </>
  );
}

export default ContactFields;