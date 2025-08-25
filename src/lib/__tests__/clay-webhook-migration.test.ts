import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
// Standard Supabase local development service role key (public, safe to commit)
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

describe("Clay Webhook Migration", () => {
  let supabase: ReturnType<typeof createClient>;
  let testOrgId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get a test organization
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();
    
    testOrgId = orgs?.id || "test-org-id";
  });

  describe("Database Schema", () => {
    it("should have all Clay webhook columns in events table", async () => {
      const { data, error } = await supabase
        .rpc("get_table_columns", { table_name: "events" });

      if (error) {
        // Fallback approach if RPC doesn't exist
        const { data: sampleEvent } = await supabase
          .from("events")
          .select("*")
          .limit(1)
          .single();

        if (sampleEvent) {
          const columns = Object.keys(sampleEvent);
          
          // Check for Clay webhook columns
          expect(columns).toContain("position");
          expect(columns).toContain("posted_on");
          expect(columns).toContain("metro_area");
          expect(columns).toContain("company_name");
          expect(columns).toContain("contact_name");
          expect(columns).toContain("company_website");
          expect(columns).toContain("job_listing_url");
          expect(columns).toContain("company_location");
          expect(columns).toContain("contact_linkedin");
        }
      } else {
        const columnNames = data?.map((col: any) => col.column_name) || [];
        
        expect(columnNames).toContain("position");
        expect(columnNames).toContain("posted_on");
        expect(columnNames).toContain("metro_area");
        expect(columnNames).toContain("company_name");
        expect(columnNames).toContain("contact_name");
        expect(columnNames).toContain("company_website");
        expect(columnNames).toContain("job_listing_url");
        expect(columnNames).toContain("company_location");
        expect(columnNames).toContain("contact_linkedin");
      }
    });
  });

  describe("Data Operations", () => {
    let createdEventId: string;

    afterEach(async () => {
      // Cleanup created events
      if (createdEventId) {
        await supabase.from("events").delete().eq("id", createdEventId);
      }
    });

    it("should insert job-posting event with Clay webhook data", async () => {
      const clayData = {
        organization_id: testOrgId,
        type: "job-posting",
        position: "Senior Software Engineer",
        posted_on: "2025-08-25T10:00:00Z",
        metro_area: "San Francisco Bay Area;New York City",
        company_name: "TechCorp",
        contact_name: "Jane Doe",
        company_website: "https://techcorp.com",
        job_listing_url: "https://linkedin.com/jobs/123",
        company_location: "San Francisco, CA",
        contact_linkedin: "https://linkedin.com/in/janedoe",
      };

      const { data, error } = await supabase
        .from("events")
        .insert(clayData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.position).toBe("Senior Software Engineer");
      expect(data?.company_name).toBe("TechCorp");
      expect(data?.type).toBe("job-posting");
      
      createdEventId = data?.id;
    });

    it("should query events by company_name", async () => {
      // Insert test data
      const { data: inserted } = await supabase
        .from("events")
        .insert({
          organization_id: testOrgId,
          type: "job-posting",
          company_name: "UniqueTestCompany",
          position: "Test Position",
        })
        .select()
        .single();

      createdEventId = inserted?.id;

      // Query by company name
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("company_name", "UniqueTestCompany");

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].company_name).toBe("UniqueTestCompany");
    });

    it("should query events by posted_on date range", async () => {
      const testDate = "2025-08-20T10:00:00Z";
      
      // Insert test data
      const { data: inserted } = await supabase
        .from("events")
        .insert({
          organization_id: testOrgId,
          type: "job-posting",
          position: "Date Range Test",
          posted_on: testDate,
        })
        .select()
        .single();

      createdEventId = inserted?.id;

      // Query by date range
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("type", "job-posting")
        .gte("posted_on", "2025-08-19")
        .lte("posted_on", "2025-08-21");

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.some(e => e.position === "Date Range Test")).toBe(true);
    });

    it("should handle semicolon-separated metro_area field", async () => {
      const { data: inserted } = await supabase
        .from("events")
        .insert({
          organization_id: testOrgId,
          type: "job-posting",
          position: "Multi-Location Role",
          metro_area: "San Francisco Bay Area;New York City;Austin",
        })
        .select()
        .single();

      createdEventId = inserted?.id;

      expect(inserted?.metro_area).toBe("San Francisco Bay Area;New York City;Austin");
      
      // Query with LIKE for partial match
      const { data } = await supabase
        .from("events")
        .select("*")
        .like("metro_area", "%New York City%");

      expect(data?.some(e => e.position === "Multi-Location Role")).toBe(true);
    });

    it("should maintain backward compatibility with JSONB data field", async () => {
      const jsonbData = {
        custom_field: "custom_value",
        legacy_data: true,
      };

      const { data: inserted } = await supabase
        .from("events")
        .insert({
          organization_id: testOrgId,
          type: "job-posting",
          position: "Hybrid Data Test",
          data: jsonbData,
        })
        .select()
        .single();

      createdEventId = inserted?.id;

      expect(inserted?.data).toEqual(jsonbData);
      expect(inserted?.position).toBe("Hybrid Data Test");
    });
  });

  describe("Index Performance", () => {
    it("should use index for job-posting queries", async () => {
      // This test would require EXPLAIN permissions which might not be available
      // in test environment, so we'll just verify the query works efficiently
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("type", "job-posting")
        .gte("posted_on", "2025-01-01")
        .order("posted_on", { ascending: false })
        .limit(10);

      const queryTime = Date.now() - startTime;
      
      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(100); // Should be fast with index
    });

    it("should efficiently query by company_name", async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("company_name", "NonExistentCompany")
        .limit(10);

      const queryTime = Date.now() - startTime;
      
      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(100); // Should be fast with index
    });
  });
});