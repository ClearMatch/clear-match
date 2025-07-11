/**
 * RLS Organization Isolation Tests
 * 
 * This test suite validates that Row Level Security policies properly isolate
 * data between organizations. These tests should FAIL initially since the
 * current RLS policies are overly permissive.
 */

import { createClient } from '@supabase/supabase-js'
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals'

// Test configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Create admin client for setup
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

// Test data
let testOrg1Id, testOrg2Id
let testUser1Id, testUser2Id
let testUser1Client, testUser2Client

describe('RLS Organization Isolation Tests', () => {
  beforeAll(async () => {
    // Generate unique emails to avoid conflicts
    const timestamp = Date.now()
    const testEmail1 = `test1-${timestamp}@example.com`
    const testEmail2 = `test2-${timestamp}@example.com`

    // Clean up any existing test data
    await adminClient.from('contact_tags').delete().neq('contact_id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('templates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Create test organizations
    const { data: orgs, error: orgError } = await adminClient
      .from('organizations')
      .insert([
        { name: 'Test Organization 1' },
        { name: 'Test Organization 2' }
      ])
      .select()

    if (orgError) throw orgError
    testOrg1Id = orgs[0].id
    testOrg2Id = orgs[1].id

    // Create test users with auth
    const { data: user1, error: user1Error } = await adminClient.auth.admin.createUser({
      email: testEmail1,
      password: 'testpassword123',
      email_confirm: true
    })
    if (user1Error) throw user1Error
    testUser1Id = user1.user.id

    const { data: user2, error: user2Error } = await adminClient.auth.admin.createUser({
      email: testEmail2,
      password: 'testpassword123',
      email_confirm: true
    })
    if (user2Error) throw user2Error
    testUser2Id = user2.user.id

    // Create profiles for test users
    await adminClient.from('profiles').insert([
      {
        id: testUser1Id,
        organization_id: testOrg1Id,
        first_name: 'Test',
        last_name: 'User 1',
        role: 'admin'
      },
      {
        id: testUser2Id,
        organization_id: testOrg2Id,
        first_name: 'Test',
        last_name: 'User 2',
        role: 'admin'
      }
    ])

    // Create authenticated clients for each user
    testUser1Client = createClient(supabaseUrl, supabaseAnonKey)
    testUser2Client = createClient(supabaseUrl, supabaseAnonKey)

    // Sign in both users
    await testUser1Client.auth.signInWithPassword({
      email: testEmail1,
      password: 'testpassword123'
    })

    await testUser2Client.auth.signInWithPassword({
      email: testEmail2,
      password: 'testpassword123'
    })
  })

  afterAll(async () => {
    // Clean up test data
    await adminClient.from('contact_tags').delete().neq('contact_id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('templates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Delete auth users if they exist
    if (testUser1Id) {
      await adminClient.auth.admin.deleteUser(testUser1Id)
    }
    if (testUser2Id) {
      await adminClient.auth.admin.deleteUser(testUser2Id)
    }
  })

  describe('Contacts Table RLS', () => {
    it('should only allow users to view contacts in their organization', async () => {
      // Debug: Check if users are signed in
      const { data: user1Auth } = await testUser1Client.auth.getUser()
      const { data: user2Auth } = await testUser2Client.auth.getUser()
      console.log('User 1 Auth:', user1Auth.user?.id, 'Expected:', testUser1Id)
      console.log('User 2 Auth:', user2Auth.user?.id, 'Expected:', testUser2Id)
      
      // Create contacts in both organizations
      await adminClient.from('contacts').insert([
        {
          organization_id: testOrg1Id,
          first_name: 'John',
          last_name: 'Doe',
          personal_email: 'john@org1.com',
          contact_type: 'candidate'
        },
        {
          organization_id: testOrg2Id,
          first_name: 'Jane',
          last_name: 'Smith',
          personal_email: 'jane@org2.com',
          contact_type: 'candidate'
        }
      ])

      // User 1 should only see contacts from org 1
      const { data: user1Contacts, error: user1Error } = await testUser1Client
        .from('contacts')
        .select('*')

      console.log('User 1 Contacts:', user1Contacts?.length, 'Error:', user1Error)
      expect(user1Error).toBeNull()
      expect(user1Contacts).toHaveLength(1)
      expect(user1Contacts[0].personal_email).toBe('john@org1.com')

      // User 2 should only see contacts from org 2
      const { data: user2Contacts, error: user2Error } = await testUser2Client
        .from('contacts')
        .select('*')

      console.log('User 2 Contacts:', user2Contacts?.length, 'Error:', user2Error)
      expect(user2Error).toBeNull()
      expect(user2Contacts).toHaveLength(1)
      expect(user2Contacts[0].personal_email).toBe('jane@org2.com')
    })

    it('should only allow users to create contacts in their organization', async () => {
      // User 1 should be able to create contact in org 1
      const { data: contact1, error: error1 } = await testUser1Client
        .from('contacts')
        .insert({
          organization_id: testOrg1Id,
          first_name: 'New',
          last_name: 'Contact1',
          personal_email: 'new1@org1.com',
          contact_type: 'candidate'
        })
        .select()

      expect(error1).toBeNull()
      expect(contact1).toHaveLength(1)

      // User 1 should NOT be able to create contact in org 2
      const { data: contact2, error: error2 } = await testUser1Client
        .from('contacts')
        .insert({
          organization_id: testOrg2Id,
          first_name: 'Unauthorized',
          last_name: 'Contact',
          personal_email: 'unauthorized@org2.com',
          contact_type: 'candidate'
        })
        .select()

      expect(error2).not.toBeNull()
      expect(contact2).toBeNull()
    })

    it('should only allow users to update contacts in their organization', async () => {
      // Create a contact in org 1
      const { data: contact } = await adminClient
        .from('contacts')
        .insert({
          organization_id: testOrg1Id,
          first_name: 'Update',
          last_name: 'Test',
          personal_email: 'update@org1.com',
          contact_type: 'candidate'
        })
        .select()

      const contactId = contact[0].id

      // User 1 should be able to update contact in org 1
      const { error: updateError1 } = await testUser1Client
        .from('contacts')
        .update({ first_name: 'Updated' })
        .eq('id', contactId)

      expect(updateError1).toBeNull()

      // User 2 should NOT be able to update contact in org 1
      const { error: updateError2 } = await testUser2Client
        .from('contacts')
        .update({ first_name: 'Unauthorized Update' })
        .eq('id', contactId)

      expect(updateError2).not.toBeNull()
    })
  })

  describe('Activities Table RLS', () => {
    it('should only allow users to view activities in their organization', async () => {
      // Create activities in both organizations
      await adminClient.from('activities').insert([
        {
          organization_id: testOrg1Id,
          type: 'call',
          description: 'Activity for org 1'
        },
        {
          organization_id: testOrg2Id,
          type: 'email',
          description: 'Activity for org 2'
        }
      ])

      // User 1 should only see activities from org 1
      const { data: user1Activities, error: user1Error } = await testUser1Client
        .from('activities')
        .select('*')

      expect(user1Error).toBeNull()
      expect(user1Activities).toHaveLength(1)
      expect(user1Activities[0].description).toBe('Activity for org 1')

      // User 2 should only see activities from org 2
      const { data: user2Activities, error: user2Error } = await testUser2Client
        .from('activities')
        .select('*')

      expect(user2Error).toBeNull()
      expect(user2Activities).toHaveLength(1)
      expect(user2Activities[0].description).toBe('Activity for org 2')
    })

    it('should only allow users to create activities in their organization', async () => {
      // User 1 should be able to create activity in org 1
      const { data: activity1, error: error1 } = await testUser1Client
        .from('activities')
        .insert({
          organization_id: testOrg1Id,
          type: 'call',
          description: 'New activity for org 1'
        })
        .select()

      expect(error1).toBeNull()
      expect(activity1).toHaveLength(1)

      // User 1 should NOT be able to create activity in org 2
      const { data: activity2, error: error2 } = await testUser1Client
        .from('activities')
        .insert({
          organization_id: testOrg2Id,
          type: 'call',
          description: 'Unauthorized activity for org 2'
        })
        .select()

      expect(error2).not.toBeNull()
      expect(activity2).toBeNull()
    })
  })

  describe('Tags Table RLS', () => {
    it('should only allow users to view tags in their organization', async () => {
      // Create tags in both organizations
      await adminClient.from('tags').insert([
        {
          organization_id: testOrg1Id,
          name: 'Tag for Org 1',
          color: '#FF0000'
        },
        {
          organization_id: testOrg2Id,
          name: 'Tag for Org 2',
          color: '#00FF00'
        }
      ])

      // User 1 should only see tags from org 1
      const { data: user1Tags, error: user1Error } = await testUser1Client
        .from('tags')
        .select('*')

      expect(user1Error).toBeNull()
      expect(user1Tags).toHaveLength(1)
      expect(user1Tags[0].name).toBe('Tag for Org 1')

      // User 2 should only see tags from org 2
      const { data: user2Tags, error: user2Error } = await testUser2Client
        .from('tags')
        .select('*')

      expect(user2Error).toBeNull()
      expect(user2Tags).toHaveLength(1)
      expect(user2Tags[0].name).toBe('Tag for Org 2')
    })

    it('should only allow users to create tags in their organization', async () => {
      // User 1 should be able to create tag in org 1
      const { data: tag1, error: error1 } = await testUser1Client
        .from('tags')
        .insert({
          organization_id: testOrg1Id,
          name: 'New Tag Org 1',
          color: '#0000FF'
        })
        .select()

      expect(error1).toBeNull()
      expect(tag1).toHaveLength(1)

      // User 1 should NOT be able to create tag in org 2
      const { data: tag2, error: error2 } = await testUser1Client
        .from('tags')
        .insert({
          organization_id: testOrg2Id,
          name: 'Unauthorized Tag Org 2',
          color: '#FF00FF'
        })
        .select()

      expect(error2).not.toBeNull()
      expect(tag2).toBeNull()
    })
  })

  describe('Templates Table RLS', () => {
    it('should only allow users to view templates in their organization', async () => {
      // Create templates in both organizations
      await adminClient.from('templates').insert([
        {
          organization_id: testOrg1Id,
          name: 'Template for Org 1',
          type: 'email',
          content: 'Email template for org 1'
        },
        {
          organization_id: testOrg2Id,
          name: 'Template for Org 2',
          type: 'email',
          content: 'Email template for org 2'
        }
      ])

      // User 1 should only see templates from org 1
      const { data: user1Templates, error: user1Error } = await testUser1Client
        .from('templates')
        .select('*')

      expect(user1Error).toBeNull()
      expect(user1Templates).toHaveLength(1)
      expect(user1Templates[0].name).toBe('Template for Org 1')

      // User 2 should only see templates from org 2
      const { data: user2Templates, error: user2Error } = await testUser2Client
        .from('templates')
        .select('*')

      expect(user2Error).toBeNull()
      expect(user2Templates).toHaveLength(1)
      expect(user2Templates[0].name).toBe('Template for Org 2')
    })

    it('should only allow users to create templates in their organization', async () => {
      // User 1 should be able to create template in org 1
      const { data: template1, error: error1 } = await testUser1Client
        .from('templates')
        .insert({
          organization_id: testOrg1Id,
          name: 'New Template Org 1',
          type: 'email',
          content: 'New email template for org 1'
        })
        .select()

      expect(error1).toBeNull()
      expect(template1).toHaveLength(1)

      // User 1 should NOT be able to create template in org 2
      const { data: template2, error: error2 } = await testUser1Client
        .from('templates')
        .insert({
          organization_id: testOrg2Id,
          name: 'Unauthorized Template Org 2',
          type: 'email',
          content: 'Unauthorized email template for org 2'
        })
        .select()

      expect(error2).not.toBeNull()
      expect(template2).toBeNull()
    })
  })

  describe('Events Table RLS', () => {
    it('should only allow users to view events in their organization', async () => {
      // Create events in both organizations
      await adminClient.from('events').insert([
        {
          organization_id: testOrg1Id,
          title: 'Event for Org 1',
          description: 'Event description for org 1',
          start_date: '2025-08-01T10:00:00Z',
          end_date: '2025-08-01T11:00:00Z'
        },
        {
          organization_id: testOrg2Id,
          title: 'Event for Org 2',
          description: 'Event description for org 2',
          start_date: '2025-08-01T14:00:00Z',
          end_date: '2025-08-01T15:00:00Z'
        }
      ])

      // User 1 should only see events from org 1
      const { data: user1Events, error: user1Error } = await testUser1Client
        .from('events')
        .select('*')

      expect(user1Error).toBeNull()
      expect(user1Events).toHaveLength(1)
      expect(user1Events[0].title).toBe('Event for Org 1')

      // User 2 should only see events from org 2
      const { data: user2Events, error: user2Error } = await testUser2Client
        .from('events')
        .select('*')

      expect(user2Error).toBeNull()
      expect(user2Events).toHaveLength(1)
      expect(user2Events[0].title).toBe('Event for Org 2')
    })
  })

  describe('Job Postings Table RLS', () => {
    it('should only allow users to view job postings in their organization', async () => {
      // Create job postings in both organizations
      await adminClient.from('job_postings').insert([
        {
          organization_id: testOrg1Id,
          title: 'Job for Org 1',
          description: 'Job description for org 1',
          status: 'active'
        },
        {
          organization_id: testOrg2Id,
          title: 'Job for Org 2',
          description: 'Job description for org 2',
          status: 'active'
        }
      ])

      // User 1 should only see job postings from org 1
      const { data: user1Jobs, error: user1Error } = await testUser1Client
        .from('job_postings')
        .select('*')

      expect(user1Error).toBeNull()
      expect(user1Jobs).toHaveLength(1)
      expect(user1Jobs[0].title).toBe('Job for Org 1')

      // User 2 should only see job postings from org 2
      const { data: user2Jobs, error: user2Error } = await testUser2Client
        .from('job_postings')
        .select('*')

      expect(user2Error).toBeNull()
      expect(user2Jobs).toHaveLength(1)
      expect(user2Jobs[0].title).toBe('Job for Org 2')
    })
  })

  describe('Profile Access Control', () => {
    it('should only allow users to view profiles in their organization', async () => {
      // User 1 should only see their own profile initially
      const { data: user1Profiles, error: user1Error } = await testUser1Client
        .from('profiles')
        .select('*')

      expect(user1Error).toBeNull()
      expect(user1Profiles).toHaveLength(1)
      expect(user1Profiles[0].id).toBe(testUser1Id)

      // User 2 should only see their own profile initially
      const { data: user2Profiles, error: user2Error } = await testUser2Client
        .from('profiles')
        .select('*')

      expect(user2Error).toBeNull()
      expect(user2Profiles).toHaveLength(1)
      expect(user2Profiles[0].id).toBe(testUser2Id)
    })
  })
})