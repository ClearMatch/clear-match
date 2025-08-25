/**
 * Tests for Clay Webhook Processing Logic
 * Tests the data processing functions that would be in the Edge Function
 */

describe("Clay Webhook Data Processing Logic", () => {
  // Helper function to validate URLs (mirrors the Edge Function)
  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Helper function to parse and validate dates (mirrors the Edge Function)
  function parseDate(dateString: string): string | null {
    try {
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
      return parsedDate.toISOString();
    } catch (error) {
      return null;
    }
  }

  // Field mapping constant (mirrors the Edge Function)
  const CLAY_FIELD_MAPPING: Record<string, string> = {
    'position': 'position',
    'posted_on': 'posted_on',
    'metro_area': 'metro_area',
    'company_name': 'company_name',
    'contact_name': 'contact_name',
    'company_website': 'company_website',
    'job_listing_url': 'job_listing_url',
    'company_location': 'company_location',
    'contact_linkedin': 'contact_linkedin',
  };

  const RESERVED_FIELDS = [
    'id',
    'contact_id', 
    'organization_id',
    'created_at',
    'updated_at',
    'created_by',
    'type',
    'email'
  ];

  describe("URL Validation", () => {
    it("should validate correct URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://example.com")).toBe(true);
      expect(isValidUrl("https://linkedin.com/in/profile")).toBe(true);
      expect(isValidUrl("https://company.com/jobs/123")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("invalid")).toBe(false);
      expect(isValidUrl("just-text")).toBe(false);
    });

    it("should handle edge cases in URL validation", () => {
      // Note: JavaScript URL constructor is permissive - these are actually valid URLs
      // We test with truly invalid formats that will throw
      expect(isValidUrl("://invalid")).toBe(false);
      expect(isValidUrl("ht tp://spaces.com")).toBe(false);
      expect(isValidUrl("\\invalid")).toBe(false);
    });
  });

  describe("Date Parsing", () => {
    it("should parse valid ISO dates", () => {
      const testDate = "2025-08-07T19:44:21.000Z";
      const result = parseDate(testDate);
      expect(result).toBe(testDate);
    });

    it("should parse various date formats", () => {
      expect(parseDate("2025-08-07")).toBeTruthy();
      expect(parseDate("Aug 7, 2025")).toBeTruthy();
      expect(parseDate("2025/08/07")).toBeTruthy();
    });

    it("should return null for invalid dates", () => {
      expect(parseDate("not-a-date")).toBeNull();
      expect(parseDate("")).toBeNull();
      expect(parseDate("2025-13-45")).toBeNull();
      expect(parseDate("invalid")).toBeNull();
    });

    it("should handle edge cases in date parsing", () => {
      expect(parseDate("0000-00-00")).toBeNull();
      expect(parseDate("9999-99-99")).toBeNull();
    });
  });

  describe("Field Mapping Logic", () => {
    it("should correctly map Clay fields to database columns", () => {
      const clayPayload = {
        type: "job-posting",
        email: "test@example.com",
        position: "Senior Developer",
        company_name: "Test Corp",
        posted_on: "2025-08-07T19:44:21.000Z",
        metro_area: "San Francisco Bay Area",
        contact_name: "John Doe",
        company_website: "https://testcorp.com",
        job_listing_url: "https://linkedin.com/jobs/123",
        company_location: "San Francisco, CA",
        contact_linkedin: "https://linkedin.com/in/johndoe",
        additional_field: "not mapped"
      };

      const { type, email, ...allFields } = clayPayload;
      const structuredData: Record<string, any> = {};
      const jsonbData: Record<string, any> = {};

      // Process Clay fields into structured columns vs JSONB
      for (const [clayField, dbColumn] of Object.entries(CLAY_FIELD_MAPPING)) {
        if (clayField in allFields && allFields[clayField] !== null && allFields[clayField] !== undefined) {
          let fieldValue = allFields[clayField];
          
          // Special handling for posted_on date field
          if (clayField === 'posted_on' && typeof fieldValue === 'string') {
            const parsedDate = parseDate(fieldValue);
            if (parsedDate) {
              structuredData[dbColumn] = parsedDate;
            } else {
              jsonbData[clayField] = fieldValue;
            }
          }
          // Special handling for URL fields
          else if (['company_website', 'job_listing_url', 'contact_linkedin'].includes(clayField) && typeof fieldValue === 'string') {
            if (isValidUrl(fieldValue)) {
              structuredData[dbColumn] = fieldValue;
            } else {
              jsonbData[clayField] = fieldValue;
            }
          }
          // Regular text fields
          else {
            structuredData[dbColumn] = fieldValue;
          }
        }
      }
      
      // Store remaining fields in JSONB (no duplication)
      for (const [key, value] of Object.entries(allFields)) {
        if (!CLAY_FIELD_MAPPING.hasOwnProperty(key) && !RESERVED_FIELDS.includes(key)) {
          jsonbData[key] = value;
        }
      }

      // Verify structured fields
      expect(structuredData.position).toBe("Senior Developer");
      expect(structuredData.company_name).toBe("Test Corp");
      expect(structuredData.posted_on).toBe("2025-08-07T19:44:21.000Z");
      expect(structuredData.metro_area).toBe("San Francisco Bay Area");
      expect(structuredData.contact_name).toBe("John Doe");
      expect(structuredData.company_website).toBe("https://testcorp.com");
      expect(structuredData.job_listing_url).toBe("https://linkedin.com/jobs/123");
      expect(structuredData.company_location).toBe("San Francisco, CA");
      expect(structuredData.contact_linkedin).toBe("https://linkedin.com/in/johndoe");

      // Verify JSONB only contains unmapped fields
      expect(jsonbData.additional_field).toBe("not mapped");
      expect(jsonbData.position).toBeUndefined(); // Should not be duplicated
      expect(jsonbData.company_name).toBeUndefined(); // Should not be duplicated

      // Verify no duplication
      expect(Object.keys(structuredData)).toHaveLength(9);
      expect(Object.keys(jsonbData)).toHaveLength(1);
    });

    it("should handle invalid URLs by storing them in JSONB", () => {
      const invalidUrlPayload = {
        position: "Developer",
        company_website: "not-a-valid-url",
        job_listing_url: "also-invalid",
        contact_linkedin: "https://valid-linkedin.com/in/user"
      };

      const structuredData: Record<string, any> = {};
      const jsonbData: Record<string, any> = {};

      // Process fields with URL validation
      for (const [clayField, dbColumn] of Object.entries(CLAY_FIELD_MAPPING)) {
        if (clayField in invalidUrlPayload) {
          let fieldValue = invalidUrlPayload[clayField];
          
          if (['company_website', 'job_listing_url', 'contact_linkedin'].includes(clayField) && typeof fieldValue === 'string') {
            if (isValidUrl(fieldValue)) {
              structuredData[dbColumn] = fieldValue;
            } else {
              jsonbData[clayField] = fieldValue;
            }
          } else {
            structuredData[dbColumn] = fieldValue;
          }
        }
      }

      // Valid LinkedIn URL should be in structured data
      expect(structuredData.contact_linkedin).toBe("https://valid-linkedin.com/in/user");
      expect(structuredData.position).toBe("Developer");
      
      // Invalid URLs should be in JSONB
      expect(jsonbData.company_website).toBe("not-a-valid-url");
      expect(jsonbData.job_listing_url).toBe("also-invalid");
      expect(jsonbData.contact_linkedin).toBeUndefined(); // Valid one went to structured
    });

    it("should handle invalid dates by storing them in JSONB", () => {
      const invalidDatePayload = {
        position: "Developer",
        posted_on: "invalid-date-format",
        company_name: "Test Corp"
      };

      const structuredData: Record<string, any> = {};
      const jsonbData: Record<string, any> = {};

      for (const [clayField, dbColumn] of Object.entries(CLAY_FIELD_MAPPING)) {
        if (clayField in invalidDatePayload) {
          let fieldValue = invalidDatePayload[clayField];
          
          if (clayField === 'posted_on' && typeof fieldValue === 'string') {
            const parsedDate = parseDate(fieldValue);
            if (parsedDate) {
              structuredData[dbColumn] = parsedDate;
            } else {
              jsonbData[clayField] = fieldValue;
            }
          } else {
            structuredData[dbColumn] = fieldValue;
          }
        }
      }

      // Valid fields should be in structured data
      expect(structuredData.position).toBe("Developer");
      expect(structuredData.company_name).toBe("Test Corp");
      
      // Invalid date should be in JSONB
      expect(jsonbData.posted_on).toBe("invalid-date-format");
      expect(structuredData.posted_on).toBeUndefined();
    });

    it("should handle null and undefined values correctly", () => {
      const nullPayload = {
        position: "Developer",
        company_name: null,
        posted_on: undefined,
        metro_area: "San Francisco"
      };

      const structuredData: Record<string, any> = {};
      const jsonbData: Record<string, any> = {};

      for (const [clayField, dbColumn] of Object.entries(CLAY_FIELD_MAPPING)) {
        if (clayField in nullPayload && nullPayload[clayField] !== null && nullPayload[clayField] !== undefined) {
          structuredData[dbColumn] = nullPayload[clayField];
        }
      }

      // Only non-null, non-undefined values should be processed
      expect(structuredData.position).toBe("Developer");
      expect(structuredData.metro_area).toBe("San Francisco");
      expect(structuredData.company_name).toBeUndefined(); // null value skipped
      expect(structuredData.posted_on).toBeUndefined(); // undefined value skipped
    });
  });

  describe("Non-Job Event Processing", () => {
    it("should store all fields in JSONB for non-job events", () => {
      const birthdayPayload = {
        person_name: "John Doe",
        birthday_date: "1990-05-15",
        celebration_notes: "Team celebration",
        position: "This should go to JSONB for birthday events",
        company_name: "Also should go to JSONB"
      };

      const structuredData: Record<string, any> = {};
      const jsonbData: Record<string, any> = {};
      const eventType = "birthday"; // Non-job event type

      if (eventType === 'job-posting') {
        // Process structured fields (not executed for birthday)
      } else {
        // For non-job events, everything goes to JSONB
        for (const [key, value] of Object.entries(birthdayPayload)) {
          if (!RESERVED_FIELDS.includes(key)) {
            jsonbData[key] = value;
          }
        }
      }

      // All fields should be in JSONB for non-job events
      expect(Object.keys(structuredData)).toHaveLength(0);
      expect(Object.keys(jsonbData)).toHaveLength(5);
      expect(jsonbData.person_name).toBe("John Doe");
      expect(jsonbData.birthday_date).toBe("1990-05-15");
      expect(jsonbData.position).toBe("This should go to JSONB for birthday events");
      expect(jsonbData.company_name).toBe("Also should go to JSONB");
    });
  });
});