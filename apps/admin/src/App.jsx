import React from 'react';
import { AdminGate, ConfigError } from './AdminGate';
import { AdminAppPage } from './surfaces/admin/AdminApp';
import { configMissing } from './lib/core';

// The admin web app is a single surface (the console renders its own internal
// nav), so no router is needed — just the auth gate around it.
export default function App() {
  if (configMissing) return <ConfigError />;
  return (
    <AdminGate>
      <AdminAppPage />
    </AdminGate>
  );
}
