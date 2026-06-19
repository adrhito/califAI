# CalifAI — Screen to Google Calendar

**[🌐 Homepage](https://adrhito.github.io/califAI/)** · **[📋 Privacy Policy](https://adrhito.github.io/califAI/PRIVACY)** · **[🐛 Issues](https://github.com/adrhito/califAI/issues)**

---

CalifAI is a Chrome extension that uses AI to extract calendar event information from any webpage and adds it directly to your Google Calendar. Select any event text on screen, let AI read it, review the details, and add it to your calendar in seconds.

## How It Works

1. Click the CalifAI icon in your Chrome toolbar
2. Drag to select the area of the page containing the event
3. AI extracts the title, date, time, location, and description
4. Review and edit the details if needed
5. Click Add — it's in your Google Calendar

## Features

- **AI-powered extraction** — uses Gemini 2.5 Flash (free tier) or OpenAI
- **Multiple events at once** — capture a full schedule and choose which to add
- **Review before adding** — edit any field on a confirmation screen
- **Download .ics** — export to Apple Calendar, Outlook, or any other app
- **Shareable link** — copy a Google Calendar link to send to someone
- **Customizable theme** — adjust colors, time format, date format, and default event color

## Installation

### From the Chrome Web Store

Coming soon.

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/adrhito/califAI.git
   cd califAI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `.output/chrome-mv3` directory

## Setup

1. Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Click the CalifAI icon and enter your key on the setup screen
3. Authorize Google Calendar access when prompted

## Tech Stack

- [WXT](https://wxt.dev/) — Web Extension Toolkit
- React 18 + TypeScript
- Zustand — state management
- Gemini 2.5 Flash / OpenAI — AI extraction
- Google Calendar API

## Scripts

```bash
npm run dev      # Development server with HMR
npm run build    # Production build
npm run zip      # Create distributable ZIP
npm run compile  # Type-check without building
```

## Privacy

The selected screenshot is sent to your chosen AI provider (Gemini or OpenAI) for event extraction only. Your Google Calendar access is handled directly through Google's OAuth flow. No data passes through any CalifAI server — there isn't one.

See the full [Privacy Policy](https://adrhito.github.io/califAI/PRIVACY).

## Support

For bugs or feature requests, [open an issue](https://github.com/adrhito/califAI/issues) or email ahito246@gmail.com.
