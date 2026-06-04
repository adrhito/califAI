# Calify - Screen to Google Calendar Chrome Extension

Calify is a Chrome extension that uses AI to extract calendar event information from any webpage and seamlessly add it to your Google Calendar.

## Features

- 🎯 **AI-Powered Extraction**: Uses Gemini 2.5 Flash to intelligently extract event details from screenshots
- 📅 **Google Calendar Integration**: Direct integration with Google Calendar API
- ✏️ **Review & Edit**: Review and modify event details before importing
- 🔒 **Privacy-First**: All processing happens locally; no data stored on external servers
- 🎨 **Clean UI**: Google Material Design-inspired interface
- ⚡ **Fast & Lightweight**: Optimized bundle size (~160KB)

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/calify.git
   cd calify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3` directory

## Setup

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a free API key

2. **Configure Calify**:
   - Click the Calify extension icon
   - Enter your API key in the setup screen
   - Authorize Google Calendar access

3. **Start Capturing**:
   - Navigate to any webpage with event information
   - Click the Calify icon
   - Click "Capture Event"
   - Review and import to your calendar

## Usage

### Capturing Events

1. Navigate to a webpage with calendar event information (email, event page, etc.)
2. Click the Calify extension icon
3. Click "Capture Event"
4. AI will extract event details from the visible page
5. Review the extracted information
6. Edit if needed
7. Click "Add to Calendar"

### Supported Event Information

Calify can extract:
- Event title
- Date and time
- Location (physical or virtual)
- Description
- Timezone
- Recurrence rules
- Reminders

### Multiple Events

If multiple events are detected on a page:
- Calify will show a selection screen
- Choose which event to add
- Each event displays a confidence score

## Development

### Tech Stack

- **Framework**: WXT (Web Extension Toolkit)
- **UI**: React 18 + TypeScript
- **State**: Zustand with chrome.storage.session persistence
- **Validation**: Zod
- **Dates**: date-fns
- **AI**: Gemini 2.5 Flash

### Project Structure

```
calify/
├── entrypoints/          # Extension entry points
│   ├── popup/           # Popup UI
│   ├── background/      # Service worker
│   └── options/         # Options page
├── components/          # React components
│   ├── ui/             # Design system
│   ├── views/          # Full page views
│   └── forms/          # Form components
├── lib/                # Core utilities
│   ├── ai/            # AI provider abstraction
│   ├── google/        # Google API utilities
│   ├── messaging/     # Chrome messaging
│   └── storage/       # Storage abstraction
├── hooks/             # React hooks
└── types/             # TypeScript types
```

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build production extension
- `npm run compile` - Type-check without building
- `npm run zip` - Create distributable ZIP file

## Privacy

Calify is designed with privacy as a priority:

- **Screen Captures**: Only held in memory during processing, never persisted
- **API Keys**: Stored in chrome.storage.local (encrypted by Chrome)
- **OAuth Tokens**: Managed by chrome.identity API (never directly accessed)
- **Event Data**: Stored in chrome.storage.session (cleared on browser close)
- **No Analytics**: No telemetry, tracking, or usage data collection
- **No History**: Event capture history is not stored

See [PRIVACY.md](PRIVACY.md) for complete privacy policy.

## Permissions

Calify requires the following permissions:

- `activeTab` - Capture visible tab content on user click
- `identity` - Google OAuth for Calendar API access
- `storage` - Store API keys and preferences locally
- `host_permissions` - Access to Gemini API endpoint

## Browser Support

- Chrome (Manifest V3)
- Edge (Chromium-based)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [WXT](https://wxt.dev/)
- UI inspired by Google Material Design 3
- AI powered by [Gemini](https://ai.google.dev/)

## Support

For issues, questions, or feature requests, please [open an issue](https://github.com/yourusername/calify/issues).
