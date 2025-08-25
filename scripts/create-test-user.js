const { createClient } = require('@supabase/supabase-js');

// Use local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'Test123456!',
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User created successfully:', data.user.email);
    console.log('User ID:', data.user.id);
  }
}

createTestUser();