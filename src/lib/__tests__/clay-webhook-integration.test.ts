import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
// Standard Supabase local development service role key (public, safe to commit)
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

describe("Clay Webhook Integration", () => {
  let supabase: ReturnType<typeof createClient>;
  let testOrgId: string;
  let createdEventIds: string[] = [];

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

  afterEach(async () => {
    // Cleanup created events
    if (createdEventIds.length > 0) {
      await supabase.from("events").delete().in("id", createdEventIds);
      createdEventIds = [];
    }
  });

  describe("Clay Webhook Payload Processing", () => {
    it("should process Clay job listing webhook payload", async () => {
      // Simulate the exact Clay payload structure from production
      const clayPayload = {
        position: "Senior Software Engineer",
        posted_on: "2025-08-07T19:44:21.000Z",
        metro_area: "Canada;New York City;San Francisco Bay Area",
        company_name: "Sysdig",
        contact_name: "Preet R.",
        company_website: "https://www.sysdig.com/",
        job_listing_url: "https://www.linkedin.com/jobs/view/senior-software-engineer-at-sysdig-4280988822",
        company_location: "San Francisco, California",
        contact_linkedin: "https://www.linkedin.com/in/preetrawal/",
      };

      // Process webhook data into event
      const eventData = {
        organization_id: testOrgId,
        type: "job-posting",
        ...clayPayload,
        // Store original payload in JSONB for backward compatibility
        data: clayPayload,
      };

      const { data: event, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(event).toBeTruthy();
      expect(event?.position).toBe("Senior Software Engineer");
      expect(event?.company_name).toBe("Sysdig");
      expect(event?.contact_name).toBe("Preet R.");
      expect(event?.metro_area).toContain("San Francisco Bay Area");
      
      if (event?.id) createdEventIds.push(event.id);
    });

    it("should handle multiple Clay webhook payloads in batch", async () => {
      const clayPayloads = [
        {
          position: "Frontend Developer",
          posted_on: "2025-08-24T10:00:00.000Z",
          company_name: "StartupA",
          contact_name: "Alice Smith",
          metro_area: "Austin;Dallas",
        },
        {
          position: "Backend Engineer",
          posted_on: "2025-08-24T11:00:00.000Z",
          company_name: "StartupB",
          contact_name: "Bob Jones",
          metro_area: "Seattle;Portland",
        },
        {
          position: "DevOps Engineer",
          posted_on: "2025-08-24T12:00:00.000Z",
          company_name: "StartupC",
          contact_name: "Carol White",
          metro_area: "Denver;Boulder",
        },
      ];

      const eventsToInsert = clayPayloads.map(payload => ({
        organization_id: testOrgId,
        type: "job-posting",
        ...payload,
        data: payload,
      }));

      const { data: events, error } = await supabase
        .from("events")
        .insert(eventsToInsert)
        .select();

      expect(error).toBeNull();
      expect(events).toHaveLength(3);
      
      events?.forEach(event => {
        expect(event.type).toBe("job-posting");
        expect(event.position).toBeTruthy();
        expect(event.company_name).toBeTruthy();
        if (event.id) createdEventIds.push(event.id);
      });
    });

    it("should handle partial Clay payload (missing optional fields)", async () => {
      const partialPayload = {
        position: "Software Engineer",
        company_name: "MinimalCorp",
        // Missing: posted_on, metro_area, contact_name, etc.
      };

      const { data: event, error } = await supabase
        .from("events")
        .insert({
          organization_id: testOrgId,
          type: "job-posting",
          ...partialPayload,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(event?.position).toBe("Software Engineer");
      expect(event?.company_name).toBe("MinimalCorp");
      expect(event?.posted_on).toBeNull();
      expect(event?.metro_area).toBeNull();
      
      if (event?.id) createdEventIds.push(event.id);
    });
  });

  describe("Event Index Page Queries", () => {
    beforeEach(async () => {
      // Setup test data for event index page
      const testEvents = [
        {
          organization_id: testOrgId,
          type: "job-posting",
          position: "Senior Developer",
          company_name: "TechCorp",
          posted_on: new Date().toISOString(),
          metro_area: "San Francisco Bay Area",
        },
        {
          organization_id: testOrgId,
          type: "job-posting",
          position: "Junior Developer",
          company_name: "StartupXYZ",
          posted_on: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          metro_area: "New York City",
        },
        {
          organization_id: testOrgId,
          type: "birthday",
          // No job-specific fields for non-job events
        },
      ];

      const { data: events } = await supabase
        .from("events")
        .insert(testEvents)
        .select();
      
      events?.forEach(e => {
        if (e.id) createdEventIds.push(e.id);
      });
    });

    it("should query job-listing events for event index page", async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("type", "job-posting")
        .order("posted_on", { ascending: false, nullsFirst: false });

      expect(error).toBeNull();
      expect(events).toBeTruthy();
      expect(events?.length).toBeGreaterThanOrEqual(2);
      // Check that at least some events have posted_on dates
      const eventsWithDates = events?.filter(e => e.posted_on !== null) || [];
      expect(eventsWithDates.length).toBeGreaterThan(0);
    });

    it("should filter events by company name", async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("type", "job-posting")
        .ilike("company_name", "%Tech%");

      expect(error).toBeNull();
      expect(events?.some(e => e.company_name === "TechCorp")).toBe(true);
    });

    it("should filter events by metro area", async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("type", "job-posting")
        .like("metro_area", "%San Francisco%");

      expect(error).toBeNull();
      expect(events?.some(e => e.position === "Senior Developer")).toBe(true);
    });

    it("should get recent job postings (last 7 days)", async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("type", "job-posting")
        .gte("posted_on", sevenDaysAgo)
        .order("posted_on", { ascending: false });

      expect(error).toBeNull();
      expect(events).toBeTruthy();
      // Should include our test events from today and yesterday
      expect(events?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Event Type Constraints", () => {
    it("should only accept valid event types", async () => {
      const invalidEvent = {
        organization_id: testOrgId,
        type: "invalid-type",
        position: "Test Position",
      };

      const { error } = await supabase
        .from("events")
        .insert(invalidEvent)
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.message).toContain("events_type_check");
    });

    it("should accept all valid event types", async () => {
      const validTypes = [
        "none",
        "job-posting",
        "layoff",
        "birthday",
        "funding-event",
        "new-job",
      ];

      for (const type of validTypes) {
        const { data, error } = await supabase
          .from("events")
          .insert({
            organization_id: testOrgId,
            type,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.type).toBe(type);
        
        if (data?.id) createdEventIds.push(data.id);
      }
    });
  });
});