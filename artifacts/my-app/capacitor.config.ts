import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.exclusivedetroit.app",
  appName: "Exclusive Detroit",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0A0A0A",
    preferredContentMode: "mobile",
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    Geolocation: {
      requestAuthorization: false,
    },
  },
};

export default config;
