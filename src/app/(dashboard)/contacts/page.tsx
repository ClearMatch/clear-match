'use client';

import { Contacts } from '@/components/Contacts';
import { Suspense } from 'react';

function ContactsContent() {
  return <Contacts />;
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactsContent />
    </Suspense>
  );
}