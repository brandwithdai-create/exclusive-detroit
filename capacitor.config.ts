import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.exclusive.app',
  appName: 'Exclusive',
  webDir: 'www',
  server: {
url:'https://exclusivedetroitapp.vercel.app',
    cleartext: false
  }
};

export default config;