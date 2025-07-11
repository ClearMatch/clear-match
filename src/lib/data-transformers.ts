/**
 * Centralized data transformation utilities for converting between 
 * form representations (strings) and database formats (arrays/jsonb)
 */

export type ContactType = "candidate" | "client" | "both";

/**
 * Database format transformers - convert form strings to database formats
 */
export const DatabaseFormatters = {
  /**
   * Convert location string to jsonb format for database storage
   */
  toLocation: (value: string | null | undefined): { location: string } | null => {
    return value && value.trim() ? { location: value.trim() } : null;
  },

  /**
   * Convert string to PostgreSQL array format
   */
  toArray: (value: string | null | undefined): string[] => {
    return value && value.trim() ? [value.trim()] : [];
  },

  /**
   * Convert string to jsonb value object format
   */
  toJsonbValue: (value: string | null | undefined): { value: string } | null => {
    return value && value.trim() ? { value: value.trim() } : null;
  },

  /**
   * Ensure contact_type is a valid enum value with fallback
   */
  toContactType: (value: any): ContactType => {
    const normalized = typeof value === "string" ? value : "";
    if (normalized === "candidate" || normalized === "client" || normalized === "both") {
      return normalized;
    }
    return "candidate"; // Default fallback
  },
};

/**
 * Form format normalizers - convert database formats to form strings
 */
export const FormNormalizers = {
  /**
   * Safely convert any value to string for form fields
   */
  toString: (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) {
      // Handle arrays - return first element or empty string
      return value.length > 0 ? String(value[0]) : "";
    }
    if (typeof value === "object") {
      // Handle jsonb objects - try to extract meaningful value
      if (value.value) return String(value.value);
      if (value.label) return String(value.label);
      if (value.name) return String(value.name);
      if (value.location) return String(value.location);
      return "";
    }
    return String(value);
  },

  /**
   * Normalize contact_type with strict enum validation
   */
  toContactType: (value: any): ContactType => {
    return DatabaseFormatters.toContactType(value);
  },

  /**
   * Convert boolean-like values to actual boolean
   */
  toBoolean: (value: any): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }
    return Boolean(value);
  },
};

/**
 * Complete contact data transformation for database operations
 */
export const ContactDataTransformer = {
  /**
   * Transform form data to database format for CREATE operations
   */
  forCreate: (formData: Record<string, any>) => ({
    ...formData,
    current_location: DatabaseFormatters.toLocation(formData.current_location),
    past_company_sizes: DatabaseFormatters.toArray(formData.past_company_sizes),
    other_social_urls: DatabaseFormatters.toJsonbValue(formData.other_social_urls),
    workplace_preferences: DatabaseFormatters.toJsonbValue(formData.workplace_preferences),
    compensation_expectations: formData.compensation_expectations || null,
    contact_type: DatabaseFormatters.toContactType(formData.contact_type),
    visa_requirements: FormNormalizers.toBoolean(formData.visa_requirements),
  }),

  /**
   * Transform form data to database format for UPDATE operations
   */
  forUpdate: (formData: Record<string, any>, userId?: string) => ({
    ...ContactDataTransformer.forCreate(formData),
    updated_by: userId,
  }),

  /**
   * Transform database data to form format for loading into forms
   */
  forForm: (dbData: Record<string, any>) => ({
    first_name: FormNormalizers.toString(dbData.first_name),
    last_name: FormNormalizers.toString(dbData.last_name),
    personal_email: FormNormalizers.toString(dbData.personal_email),
    work_email: FormNormalizers.toString(dbData.work_email),
    phone: FormNormalizers.toString(dbData.phone),
    linkedin_url: FormNormalizers.toString(dbData.linkedin_url),
    github_url: FormNormalizers.toString(dbData.github_url),
    other_social_urls: FormNormalizers.toString(dbData.other_social_urls),
    resume_url: FormNormalizers.toString(dbData.resume_url),
    functional_role: FormNormalizers.toString(dbData.functional_role),
    current_location: FormNormalizers.toString(dbData.current_location),
    current_job_title: FormNormalizers.toString(dbData.current_job_title),
    current_company: FormNormalizers.toString(dbData.current_company),
    current_company_size: FormNormalizers.toString(dbData.current_company_size),
    contact_type: FormNormalizers.toContactType(dbData.contact_type),
    workplace_preferences: FormNormalizers.toString(dbData.workplace_preferences),
    compensation_expectations: FormNormalizers.toString(dbData.compensation_expectations),
    visa_requirements: FormNormalizers.toBoolean(dbData.visa_requirements),
    past_company_sizes: FormNormalizers.toString(dbData.past_company_sizes),
    urgency_level: FormNormalizers.toString(dbData.urgency_level),
    employment_status: FormNormalizers.toString(dbData.employment_status),
  }),
};

/**
 * Error context builder for better error reporting
 */
export class DetailedError extends Error {
  public context: Record<string, any>;

  constructor(message: string, context: Record<string, any> = {}) {
    super(message);
    this.name = "DetailedError";
    this.context = context;
  }
}

/**
 * Validation helpers
 */
export const DataValidators = {
  /**
   * Validate that contact_type is one of the allowed enum values
   */
  isValidContactType: (value: any): value is ContactType => {
    return typeof value === "string" && 
           ["candidate", "client", "both"].includes(value);
  },

  /**
   * Validate email format
   */
  isValidEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Validate URL format (optional)
   */
  isValidUrl: (value: string): boolean => {
    if (!value.trim()) return true; // Optional URLs can be empty
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
};