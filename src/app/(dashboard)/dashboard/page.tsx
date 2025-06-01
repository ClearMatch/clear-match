import { Dashboard } from '@/components/Dashboard';
import { HubSpotService } from '@/lib/services/hubspot';

const organization_id = 'b750c677-4a96-47f3-b2a3-f8263138f0af';

export default async function DashboardPage() {

  try {
    const hubspotService = new HubSpotService(
      process.env.HUBSPOT_ACCESS_TOKEN!,
      organization_id
    );

    // TODO: Replace 'temp-user-id' with actual user ID once auth is implemented
    const result = await hubspotService.syncContacts('temp-user-id');

    if (!result.success) {
      throw result.error;
    }

    console.log(`Successfully synced ${result.syncedCount} contacts`);
  } catch (error) {
    console.error('Error in dashboard sync:', error);
  }

  return <Dashboard />;
}