import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  manifest: {
    name: 'CalifAI',
    description: 'Capture calendar events from any webpage and add them to Google Calendar',
    version: '1.0.0',
    permissions: [
      'activeTab',
      'identity',
      'storage',
      'scripting',
      'notifications'
    ],
    host_permissions: [
      'https://generativelanguage.googleapis.com/*',
      'https://api.openai.com/*',
      'https://www.googleapis.com/*'
    ],
    oauth2: {
      client_id: '29128209703-3e0pfupj87r6lp8d206k0j1ldj20d25e.apps.googleusercontent.com',
      scopes: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    },
    web_accessible_resources: [
      {
        resources: ['tesseract-worker.min.js'],
        matches: ['<all_urls>']
      }
    ]
  },
  vite: () => ({
    plugins: [react()]
  })
});
