"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function HubSpotSync() {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  

  const syncContacts = async () => {
    setSyncing(true);
    try {
      console.log('Starting sync process');
      
      // Get current session with detailed logging
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check:', { hasSession: !!session, error: sessionError });
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error('No session found');
        throw new Error('Please sign in to sync contacts');
      }

      console.log('Getting user profile for:', session.user.id);
      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();


      const organization_id = 'b750c677-4a96-47f3-b2a3-f8263138f0af';

      // Fetch contacts from HubSpot
      const hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=100', {
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!hubspotResponse.ok) {
        throw new Error('Failed to fetch contacts from HubSpot');
      }

      const hubspotData = await hubspotResponse.json();
      const contacts = hubspotData.results;

      // Transform HubSpot contacts to match our candidates table structure
      const candidates = contacts.map((contact: any) => {
        const properties = contact.properties;
        return {
          organization_id: organization_id,
          first_name: properties.firstname || '',
          last_name: properties.lastname || '',
          personal_email: properties.email || null,
          work_email: properties.work_email || null,
          phone: properties.phone || null,
          linkedin_url: properties.linkedin_url || null,
          current_job_title: properties.jobtitle || null,
          current_company: properties.company || null,
          current_location: properties.city ? {
            city: properties.city,
            category: properties.state || 'Unknown'
          } : null,
          relationship_type: 'candidate',
          functional_role: properties.job_function || null,
          is_active_looking: false,
          tech_stack: properties.tech_stack ? properties.tech_stack.split(';') : [],
          current_industry: properties.industry || null,
          created_by: session.user.id,
          updated_by: session.user.id,
          nurturing_info: {
            source: 'hubspot',
            hubspot_id: contact.id,
            last_sync: new Date().toISOString(),
            properties: properties
          }
        };
      });

      // Insert or update candidates
      const { data: insertedCandidates, error: insertError } = await supabase
        .from('candidates')
        .upsert(
          candidates,
          {
            onConflict: 'organization_id,personal_email',
            ignoreDuplicates: false
          }
        );

      if (insertError) {
        throw insertError;
      }

      // Create activity records
      const activities = candidates.map((candidate: any) => ({
        organization_id,
        candidate_id: candidate.id,
        type: 'sync',
        description: 'Synced from HubSpot',
        metadata: {
          source: 'hubspot',
          sync_date: new Date().toISOString()
        },
        created_by: session.user.id
      }));

      if (activities.length > 0) {
        const { error: activityError } = await supabase
          .from('activities')
          .insert(activities);

        if (activityError) {
          console.error('Error creating activity records:', activityError);
        }
      }

      toast({
        title: 'Sync Completed',
        description: `Successfully synced ${candidates.length} contacts from HubSpot.`,
      });
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync contacts from HubSpot. Please try again.',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={syncContacts}
      disabled={syncing}
      variant="outline"
      className="gap-2"
    >
      {syncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Sync HubSpot Contacts
        </>
      )}
    </Button>
  );
} 