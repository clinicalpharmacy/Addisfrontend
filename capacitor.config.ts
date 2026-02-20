import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.addis.clinicalpharmacy',
    appName: 'Addis Clinical',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    android: {
        // FLAG_SECURE is set in MainActivity.java (see android/ folder)
        allowMixedContent: false,
        captureInput: true,
        webContentsDebuggingEnabled: false  // disable in production
    }
};

export default config;
