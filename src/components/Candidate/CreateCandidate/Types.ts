import { UseFormRegister, FieldError } from 'react-hook-form';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  personal_email: string;
  work_email?: string;
  phone: string;
  linkedin_url?: string;
  github_url?: string;
  other_social_url?: string;
  resume_url?: string;
}

interface FormFieldProps {
  id: keyof ProfileFormData;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url';
  placeholder: string;
  required?: boolean;
  register: UseFormRegister<ProfileFormData>;
  error?: FieldError;
  className?: string;
}