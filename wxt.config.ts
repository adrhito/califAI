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
      'storage'
    ],
    host_permissions: [
      'https://generativelanguage.googleapis.com/*',
      'https://api.openai.com/*'
    ],
    oauth2: {
      client_id: '29128209703-m2inv6blj306tqn2cbpavsuffu92g2et.apps.googleusercontent.com',
      scopes: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
      ]
    },
    action: {
      default_title: 'CalifAI - Add to Calendar'
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
