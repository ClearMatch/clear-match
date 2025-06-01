import { Settings } from '@/components/Settings';
import { supabase } from '@/lib/supabase';
import { paragon } from '@useparagon/connect';

export default async function SettingsPage() {
  const { data: { session } } = await supabase.auth.getSession();
  paragon.authenticate( process.env.PARAGON_PROJECT_ID!, session?.user.id!);
  paragon.connect("hubspot", {});
  return <Settings />;
}