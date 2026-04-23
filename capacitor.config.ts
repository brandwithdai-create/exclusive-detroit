import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.exclusivecityguide.app',
  appName: 'Exclusive',
  webDir: 'www',
  server: {
url:'https://exclusivedetroitapp.vercel.app',
    cleartext: false
  }
};

export default config;