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
      'https://generativelanguage.googleapis.com/*'
    ],
    oauth2: {
      client_id: '1032616596177-vhtiqvnhafn63pbkqhp5itrkk28ht994.apps.googleusercontent.com',
      scopes: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
      ]
    },
    action: {
      default_title: 'CalifAI - Add to Calendar'
    }
  },
  vite: () => ({
    plugins: [react()]
  })
});
