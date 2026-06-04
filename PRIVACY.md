# Privacy Policy for Calify

Last Updated: June 4, 2026

## Overview

Calify is committed to protecting your privacy. This privacy policy explains how Calify handles your data when you use the Chrome extension.

## Data Collection and Usage

### What Data We Access

1. **Screen Captures**
   - When: Only when you click "Capture Event"
   - What: Screenshot of the active browser tab
   - Purpose: Extract calendar event information using AI
   - Storage: Temporarily held in memory during processing only
   - Retention: Immediately discarded after AI processing completes

2. **API Keys**
   - What: Your Gemini API key
   - Storage: chrome.storage.local (encrypted by Chrome)
   - Purpose: Authenticate requests to Gemini API
   - Access: Never transmitted except to Gemini API

3. **Google Calendar Access**
   - What: OAuth tokens for Google Calendar API
   - Storage: Managed by chrome.identity API
   - Purpose: Create events in your Google Calendar
   - Scopes: calendar.events (create events) and calendar.readonly (list calendars)

4. **Event Data**
   - What: Extracted calendar event details
   - Storage: chrome.storage.session (cleared when browser closes)
   - Purpose: Allow you to review and edit before importing
   - Retention: Until you close the browser or manually reset

5. **User Preferences**
   - What: Default timezone and other settings
   - Storage: chrome.storage.local
   - Purpose: Personalize your experience

### What We Don't Collect

- ❌ No browsing history
- ❌ No personal information beyond what you explicitly provide
- ❌ No analytics or telemetry
- ❌ No tracking cookies
- ❌ No crash reports
- ❌ No usage statistics
- ❌ No event history after import

## Data Transmission

### Third-Party Services

Calify communicates with two external services:

1. **Google Gemini API**
   - Purpose: AI-powered event extraction from screenshots
   - Data Sent: Screenshot images (JPEG), your API key
   - Data Received: Structured event information
   - Privacy: Subject to [Google's Privacy Policy](https://policies.google.com/privacy)
   - Note: We use YOUR API key; Google bills you directly for API usage

2. **Google Calendar API**
   - Purpose: Create calendar events, list calendars
   - Data Sent: Event details, OAuth tokens
   - Data Received: Created event information
   - Privacy: Subject to [Google's Privacy Policy](https://policies.google.com/privacy)
   - Note: Uses standard OAuth2 flow; Calify never sees your password

### No Other External Servers

- Calify does NOT use any backend servers
- All processing happens locally in your browser
- No data is sent to Calify developers or third parties (except as noted above)

## Data Security

### Local Storage Security

- All local data is stored using Chrome's storage APIs
- Chrome encrypts storage on disk
- Storage is isolated per-extension (other extensions cannot access it)

### Screenshot Handling

1. Screenshot captured when you click "Capture Event"
2. Converted to JPEG (85% quality) for efficient transmission
3. Sent to Gemini API for processing
4. Response received and parsed
5. Screenshot immediately garbage collected (never saved to disk)

### API Key Security

- Stored in chrome.storage.local (encrypted by Chrome)
- Never logged or displayed in plain text (password field in UI)
- Only transmitted over HTTPS to Gemini API
- Never sent to any other service

### OAuth Token Security

- Managed entirely by Chrome's identity API
- Calify never directly accesses refresh tokens
- Access tokens are automatically refreshed when expired
- Tokens are revocable from your Google Account settings

## Your Rights and Controls

### Data Access

You can access all data Calify stores:
- API Key: Open extension options page
- Preferences: Open extension options page
- Session State: Visible in the extension popup

### Data Deletion

You can delete all Calify data:
1. Right-click the extension icon → "Remove from Chrome"
2. Or manually: Chrome Storage → Clear extension data

### Google Calendar Access

You can revoke Calify's access to Google Calendar:
1. Visit [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find "Calify" and click "Remove Access"

### API Usage

Since you provide your own Gemini API key:
- You control API usage and costs
- You can monitor usage in Google AI Studio
- You can delete or rotate your API key at any time

## Children's Privacy

Calify is not directed at children under 13. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy. Changes will be reflected in:
- The "Last Updated" date at the top
- The extension changelog
- The GitHub repository

## Open Source

Calify is open source. You can audit the code at:
- GitHub: [github.com/yourusername/calify](https://github.com/yourusername/calify)

## Contact

For privacy questions or concerns:
- Open an issue: [GitHub Issues](https://github.com/yourusername/calify/issues)
- Email: privacy@example.com

## Compliance

- **GDPR**: Calify does not collect personal data for processing beyond temporary event extraction
- **CCPA**: California residents have the right to know what data is collected (see above)
- **Chrome Web Store**: Complies with Chrome Web Store Developer Program Policies

## Summary

In plain English:
- Calify only sees what you explicitly capture
- Screenshots are processed and immediately deleted
- Your API key and preferences stay on your device
- No tracking, analytics, or data collection
- You control your Google Calendar access
- Everything is open source and auditable
