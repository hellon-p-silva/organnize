import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.organnize.app',
  appName: 'Organnize',
  webDir: 'dist',
  backgroundColor: '#12110f',
  android: {
    backgroundColor: '#12110f',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
  },
};

export default config;
