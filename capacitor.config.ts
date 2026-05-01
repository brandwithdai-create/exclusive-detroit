import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.exclusivecityguide.app',
  appName: 'Exclusive',
  webDir: 'www',
  server: {
url:'https://www.exclusivedetroitapp.com',
    cleartext: false
  }
};

export default config;