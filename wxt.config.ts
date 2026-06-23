import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['tabs', 'activeTab'],
    host_permissions: ['*://*.prologistics.info/*'],
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.mode === 'development') {
        // add (DEV) suffix to extension's name in dev mode
        manifest.name += ' (DEV)';
      }
    },
  },
  webExt: {
    disabled: true, // toggle if needed
    startUrls: ['https://prologistics.info', 'https://prolodev.prologistics.info'],
  },
});
