import React from 'react';
import { AdminGate } from './AdminGate';
import { AdminAppPage } from './surfaces/admin/AdminApp';

// The admin web app is a single surface (the console renders its own internal
// nav), so no router is needed — just the auth gate around it.
export default function App() {
  return (
    <AdminGate>
      <AdminAppPage />
    </AdminGate>
  );
}
