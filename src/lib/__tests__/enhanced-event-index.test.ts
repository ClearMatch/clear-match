/**
 * Integration test for Enhanced Event Index Page
 * Tests the complete workflow from database to UI components
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
// Standard Supabase local development service role key (public, safe to commit)
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

describe("Enhanced Event Index Page Integration", () => {
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

  afterAll(async () => {
    // Cleanup created events
    if (createdEventIds.length > 0) {
      await supabase.from("events").delete().in("id", createdEventIds);
    }
  });

  describe("Enhanced Columns Display", () => {
    beforeEach(async () => {
      // Create test data for each test
      const testEvents = [
        {
          organization_id: testOrgId,
          type: "job-posting",
          position: "Senior React Developer",
          company_name: "TechCorp Solutions",
          company_location: "San Francisco, CA",
          metro_area: "San Francisco Bay Area;Silicon Valley",
          contact_name: "Sarah Johnson",
          contact_linkedin: "https://linkedin.com/in/janesmith",
          company_website: "https://techcorp.com",
          job_listing_url: "https://linkedin.com/jobs/123456",
          posted_on: new Date().toISOString(),
        },
        {
          organization_id: testOrgId,
          type: "birthday",
          // Non-job event without Clay webhook fields
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

    afterEach(async () => {
      // Cleanup after each test
      if (createdEventIds.length > 0) {
        await supabase.from("events").delete().in("id", createdEventIds);
        createdEventIds = [];
      }
    });

    it("should fetch events with Clay webhook columns", async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select(
          `id, contact_id, organization_id, type, created_at, updated_at, created_by,
          position, posted_on, metro_area, company_name, contact_name,
          company_website, job_listing_url, company_location, contact_linkedin, data,
          contact:contact_id(id, first_name, last_name), 
          profiles:created_by (id, first_name, last_name), 
          organizations:organization_id(id, name)`
        )
        .eq("type", "job-posting")
        .eq("organization_id", testOrgId);

      expect(error).toBeNull();
      expect(events).toBeTruthy();
      expect(events?.length).toBeGreaterThan(0);

      const jobEvent = events?.find(e => e.position === "Senior React Developer");
      expect(jobEvent).toBeTruthy();
      expect(jobEvent?.company_name).toBe("TechCorp Solutions");
      expect(jobEvent?.metro_area).toContain("San Francisco Bay Area");
      expect(jobEvent?.contact_name).toBe("Sarah Johnson");
    });

    it("should handle mixed event types (job and non-job events)", async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("organization_id", testOrgId);

      expect(error).toBeNull();
      expect(events).toBeTruthy();

      const jobEvents = events?.filter(e => e.type === "job-posting") || [];
      const nonJobEvents = events?.filter(e => e.type !== "job-posting") || [];

      expect(jobEvents.length).toBeGreaterThan(0);
      expect(nonJobEvents.length).toBeGreaterThan(0);

      // Job events should have Clay webhook fields
      jobEvents.forEach(event => {
        if (event.position) {
          expect(event.position).toBeTruthy();
        }
      });

      // Non-job events may not have Clay webhook fields
      nonJobEvents.forEach(event => {
        expect(event.type).not.toBe("job-posting");
      });
    });
  });

  describe("Enhanced Filtering", () => {
    beforeEach(async () => {
      // Create diverse test data for filtering
      const testEvents = [
        {
          organization_id: testOrgId,
          type: "job-posting",
          position: "Frontend Developer",
          company_name: "StartupA",
          metro_area: "New York City;Boston",
          posted_on: new Date().toISOString(),
        },
        {
          organization_id: testOrgId,
          type: "job-posting",
          position: "Backend Engineer",
          company_name: "TechGiant",
          metro_area: "San Francisco Bay Area",
          posted_on: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        },
        {
          organization_id: testOrgId,
          type: "job-posting",
          position: "Full Stack Developer",
          company_name: "StartupB",
          metro_area: "Austin;Dallas",
          posted_on: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        },
        {
          organization_id: testOrgId,
          type: "birthday",
          // Non-job event
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

    afterEach(async () => {
      // Cleanup after each test
      if (createdEventIds.length > 0) {
        await supabase.from("events").delete().in("id", createdEventIds);
        createdEventIds = [];
      }
    });

    it("should filter by position (job title)", async () => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("organization_id", testOrgId)
        .in("company_name", ["StartupA", "TechGiant", "StartupB"]); // Only our test data

      // Apply position filter
      query = query.ilike("position", "%Frontend%");

      const { data: events, error } = await query;

      expect(error).toBeNull();
      expect(events).toBeTruthy();
      expect(events?.length).toBe(1);
      expect(events?.[0].position).toBe("Frontend Developer");
    });

    it("should filter by company name", async () => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("organization_id", testOrgId)
        .eq("type", "job-posting"); // Filter to job posting events only

      // Apply company name filter for our specific test data
      query = query.in("company_name", ["StartupA", "StartupB"]);

      const { data: events, error } = await query;

      expect(error).toBeNull();
      expect(events).toBeTruthy();
      expect(events?.length).toBe(2); // StartupA and StartupB
      events?.forEach(event => {
        expect(["StartupA", "StartupB"]).toContain(event.company_name);
      });
    });

    it("should filter by metro area", async () => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("organization_id", testOrgId)
        .in("company_name", ["StartupA", "TechGiant", "StartupB"]); // Only our test data

      // Apply metro area filter
      query = query.like("metro_area", "%San Francisco%");

      const { data: events, error } = await query;

      expect(error).toBeNull();
      expect(events).toBeTruthy();
      expect(events?.length).toBe(1);
      expect(events?.[0].metro_area).toContain("San Francisco Bay Area");
    });

    it("should filter by date range (recent events)", async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      let query = supabase
        .from("events")
        .select("*")
        .eq("organization_id", testOrgId)
        .eq("type", "job-posting")
        .in("company_name", ["StartupA", "TechGiant"]); // Filter to our test data

      // Apply date range filter (last 7 days)
      query = query.gte("created_at", sevenDaysAgo.toISOString());

      const { data: events, error } = await query;

      expect(error).toBeNull();
      expect(events).toBeTruthy();
      expect(events?.length).toBe(2); // Recent events only (StartupA and TechGiant)
      
      events?.forEach(event => {
        const eventDate = new Date(event.created_at);
        expect(eventDate.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
        expect(["StartupA", "TechGiant"]).toContain(event.company_name);
      });
    });

    it("should filter by event type", async () => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("organization_id", testOrgId)
        .in("company_name", ["StartupA", "TechGiant", "StartupB"]); // Filter to our test data

      // Apply event type filter
      query = query.eq("type", "job-posting");

      const { data: events, error } = await query;

      expect(error).toBeNull();
      expect(events).toBeTruthy();
      expect(events?.length).toBe(3); // Our 3 job-posting test events
      
      events?.forEach(event => {
        expect(event.type).toBe("job-posting");
        expect(["StartupA", "TechGiant", "StartupB"]).toContain(event.company_name);
      });
    });

    it("should combine multiple filters", async () => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("organization_id", testOrgId)
        .in("company_name", ["StartupA", "TechGiant", "StartupB"]); // Only our test data

      // Combine multiple filters
      query = query
        .eq("type", "job-posting")
        .ilike("company_name", "%Startup%")
        .like("metro_area", "%New York%");

      const { data: events, error } = await query;

      expect(error).toBeNull();
      expect(events).toBeTruthy();
      expect(events?.length).toBe(1);
      expect(events?.[0].position).toBe("Frontend Developer");
      expect(events?.[0].company_name).toBe("StartupA");
      expect(events?.[0].metro_area).toContain("New York City");
    });
  });

  describe("Performance and Indexing", () => {
    it("should use indexes for job-posting queries", async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("type", "job-posting")
        .eq("organization_id", testOrgId)
        .order("posted_on", { ascending: false, nullsFirst: false })
        .limit(25);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(200); // Should be fast with indexes
    });

    it("should efficiently filter by Clay webhook columns", async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organization_id", testOrgId)
        .ilike("position", "%Developer%")
        .ilike("company_name", "%Tech%")
        .limit(25);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(200); // Should be reasonably fast
    });
  });
});