# Privacy Policy — CalifAI

**Last updated: June 2026**

This Privacy Policy describes how CalifAI ("the Extension", "we", "us") handles your information. By using CalifAI, you agree to the practices described below.

---

## Who We Are

CalifAI is a Chrome browser extension developed and maintained by Adrian Hito. Contact: ahito246@gmail.com

---

## What Data CalifAI Collects

### 1. Website Content (Screenshot Data)
When you use CalifAI to capture an event, a screenshot of the area you selected on the current webpage is created. This screenshot is sent to your chosen AI provider (Google Gemini or OpenAI) to extract event details such as title, date, time, and location.

- The screenshot contains only the portion of the page you explicitly dragged to select
- It is sent directly from your browser to the AI provider's API
- It is not stored on any CalifAI server (there is none)
- It is subject to the privacy policy of your chosen AI provider:
  - Google Gemini: https://policies.google.com/privacy
  - OpenAI: https://openai.com/privacy

### 2. API Keys
Your AI provider API key (Gemini or OpenAI) is stored locally in Chrome's `chrome.storage.local` on your own device. It is never transmitted to any CalifAI server or any party other than the AI provider when making an extraction request.

### 3. User Preferences and Settings
The following settings are stored locally on your device in `chrome.storage.local`:
- AI provider selection (Gemini or OpenAI)
- Color theme preferences (primary and secondary colors)
- Time format preference (12-hour or 24-hour)
- Date format preference (US or ISO)
- Default event color
- Default reminder settings

None of these are transmitted externally.

### 4. Session State
Temporary session data (current view, captured events, selected events) is stored in `chrome.storage.session` and is automatically cleared when you close the browser. It never leaves your device.

### 5. Google Account Access
When you connect your Google account to add events to Google Calendar, CalifAI uses Google's OAuth 2.0 flow via `chrome.identity`. The resulting access token is stored locally in `chrome.storage.local` and is used only to call the Google Calendar API to create events. CalifAI does not access, read, or store any calendar data beyond what is needed to create a new event.

### 6. Usage Analytics (Future)
CalifAI may in future versions collect anonymized, aggregated usage data (for example: how often captures are performed, which AI provider is used) to improve the product. If and when this is implemented, this policy will be updated and users will be notified. No such data is collected in the current version.

---

## What Data CalifAI Does Not Collect

- Your name, email address, or any personally identifiable information
- Your browsing history or the URLs of pages you visit
- The full contents of any webpage — only the screenshot of the area you select
- Payment or financial information
- Health information
- Any data from pages where you do not actively trigger a capture

---

## How Data Is Used

| Data | Purpose |
|------|---------|
| Selected screenshot | Sent to AI provider to extract event details |
| API key | Authenticate requests to the AI provider API |
| Google OAuth token | Create events in Google Calendar on your behalf |
| Settings | Personalize the extension UI and defaults |

---

## Data Sharing and Third Parties

CalifAI does not sell, rent, or trade your data.

The only third parties that receive any data are:

- **Google Gemini API** — receives the selected screenshot if Gemini is your chosen provider
- **OpenAI API** — receives the selected screenshot if OpenAI is your chosen provider
- **Google Calendar API** — receives new event details (title, date, time, location) to create calendar entries

No other parties receive any data.

---

## Data Retention

- Screenshot data: not retained by CalifAI. Retention by the AI provider is governed by their own policies.
- API keys and settings: retained locally on your device until you uninstall the extension or clear Chrome's extension storage.
- Session state: cleared automatically when the browser is closed.
- Google OAuth token: retained locally until it expires or you disconnect your Google account from the extension.

---

## Your Rights and Choices

- **Remove your API key**: open CalifAI Settings and clear the API key field at any time
- **Disconnect Google Calendar**: revoke CalifAI's access at myaccount.google.com/permissions
- **Delete all local data**: uninstalling the extension removes all locally stored data
- **Switch AI providers**: you can switch between Gemini and OpenAI at any time in Settings

---

## Children's Privacy

CalifAI is not directed at children under the age of 13. We do not knowingly collect any information from children.

---

## Changes to This Policy

If this policy changes materially, the "Last updated" date at the top will be revised. Continued use of the extension after changes constitutes acceptance of the updated policy.

---

## Contact

For privacy questions or concerns, contact:

**Adrian Hito**
lennyface2121@gmail.com
