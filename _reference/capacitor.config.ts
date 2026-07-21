import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ro.sportriposta.riposte',
  appName: 'Riposte',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    // The 'riposte' URL scheme for OAuth deep links is registered in
    // Info.plist — run scripts/ios-setup.sh after 'npx cap add ios'.
  },
};

export default config;
