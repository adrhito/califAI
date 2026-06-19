# Chrome Web Store Submission Guide for Calify

## Prerequisites

1. **Chrome Web Store Developer Account**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Sign in with your Google account
   - Pay one-time $5 registration fee (if not already registered)

2. **Extension Package**
   - ✅ ZIP file created: `calify-extension.zip` (located in project root)

## Store Listing Information

### Basic Information

**Extension Name**: Calify

**Short Description** (132 characters max):
```
AI-powered tool to capture calendar events from any webpage and add them to Google Calendar
```

**Detailed Description**:
```
Calify makes it effortless to add events to your Google Calendar from any webpage.

HOW IT WORKS
1. Navigate to any webpage with event information (email, event page, social media)
2. Click the Calify extension icon
3. Click "Capture Event"
4. AI extracts event details from the visible page
5. Review and edit the information
6. Add directly to your Google Calendar

KEY FEATURES
• AI-Powered Extraction - Uses Gemini AI to intelligently detect and extract event details
• Smart Recognition - Automatically detects title, date, time, location, and description
• Review & Edit - Full control to review and modify details before importing
• Multiple Event Support - Handles pages with multiple events
• Timezone Support - Automatically detects and allows timezone selection
• Privacy-First - All processing happens locally; no data stored on external servers
• Clean Interface - Simple, intuitive design inspired by Google Material Design

WHAT CALIFY EXTRACTS
• Event title and description
• Date and time
• Location (physical or virtual meeting links)
• Timezone
• Event duration

PRIVACY & SECURITY
• Screenshots are processed in memory only and immediately deleted
• Your API key stays on your device (encrypted by Chrome)
• Google Calendar access uses standard OAuth (we never see your password)
• No tracking, analytics, or data collection
• Open source - audit the code yourself

SETUP REQUIRED
You'll need a free Google Gemini API key to use Calify:
1. Visit Google AI Studio (https://aistudio.google.com/app/apikey)
2. Create a free API key
3. Enter it in Calify's settings

Perfect for:
• Professionals managing busy calendars
• Event coordinators
• Anyone who frequently adds events from emails or websites

Support: For issues or questions, visit our GitHub repository
```

### Category
**Primary Category**: Productivity

**Language**: English

### Privacy

**Privacy Policy URL**:
- You'll need to host PRIVACY.md on a public URL (GitHub Pages or your website)
- Example: `https://yourusername.github.io/calify/PRIVACY.html`

**Permissions Justification**:

1. **activeTab**: Required to capture the visible webpage content when you click "Capture Event"

2. **identity**: Required to authenticate with Google Calendar API using OAuth to create events in your calendar

3. **storage**: Required to securely store your API key and user preferences locally on your device

4. **host_permissions for generativelanguage.googleapis.com**: Required to send screenshots to Google Gemini API for AI-powered event extraction

5. **host_permissions for api.openai.com**: Required for optional OpenAI provider support

6. **host_permissions for www.googleapis.com**: Required to create events in Google Calendar and list your calendars

## Required Assets

### 1. Extension Icon (Already Created ✅)
- 128x128px PNG: `icon-128.png`

### 2. Screenshots (Need to Create)

**Requirements**:
- Size: 1280x800px or 640x400px (1280x800 recommended)
- Format: PNG or JPEG
- Count: Minimum 1, recommended 3-5
- No padding/borders needed

**Recommended Screenshots**:

1. **Home Screen** - Show the main popup with "Capture Event" button
2. **Review Screen** - Show extracted event details being reviewed
3. **Edit Screen** - Show the edit interface with date/time pickers
4. **Success Screen** - Show successful calendar import
5. **Settings Screen** - Show the options page with API key setup

### 3. Promotional Images (Optional but Recommended)

**Small Tile** (recommended):
- Size: 440x280px
- Format: PNG or JPEG
- Shows in search results and category pages

**Large Tile** (optional):
- Size: 920x680px
- Format: PNG or JPEG

**Marquee** (optional):
- Size: 1400x560px
- Format: PNG or JPEG

## Submission Steps

### Step 1: Create Screenshots

Take screenshots of your extension in use:

```bash
# Load the extension in Chrome
# Navigate to chrome://extensions/
# Reload Calify
# Open the extension and take screenshots at 1280x800 resolution
```

Save screenshots as:
- `screenshot-1-home.png`
- `screenshot-2-review.png`
- `screenshot-3-edit.png`
- `screenshot-4-success.png`
- `screenshot-5-settings.png`

### Step 2: Host Privacy Policy

Option 1 - GitHub Pages:
```bash
# Create a docs folder
mkdir docs
cp PRIVACY.md docs/PRIVACY.md

# Push to GitHub
git add docs/
git commit -m "Add privacy policy for web hosting"
git push

# Enable GitHub Pages in repository settings
# Select "main" branch and "/docs" folder
# Privacy URL will be: https://yourusername.github.io/calify/PRIVACY.html
```

Option 2 - Convert to HTML and host anywhere:
```markdown
Copy PRIVACY.md content and convert to simple HTML
Host on your personal website or any static hosting service
```

### Step 3: Submit to Chrome Web Store

1. **Go to Developer Dashboard**
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Click "New Item"

2. **Upload ZIP**
   - Upload `calify-extension.zip`
   - Wait for automated checks to complete

3. **Store Listing Tab**
   - Fill in all the information from the "Store Listing Information" section above
   - Upload icon (128x128px)
   - Upload screenshots (1280x800px)
   - Optional: Upload promotional tiles

4. **Privacy Tab**
   - Add Privacy Policy URL
   - Complete the Privacy Practices disclosure:
     - Select: "Handles user data"
     - Data usage: Event data (temporarily for AI processing)
     - Check: "This extension does NOT collect or transmit user data"
     - Add justification for permissions (see above)

5. **Pricing & Distribution**
   - Pricing: Free
   - Visibility: Public
   - Distribution: All regions (or select specific countries)

6. **Submit for Review**
   - Click "Submit for Review"
   - Review typically takes 1-3 business days
   - You'll receive email notifications about status

## Post-Submission

### If Approved
- Extension will be published to Chrome Web Store
- Update README.md with store link
- Share with users!

### If Rejected
Common reasons and fixes:
- **Missing privacy policy**: Add hosted privacy policy URL
- **Unclear permissions**: Add detailed justification for each permission
- **Screenshots needed**: Add at least 1 screenshot
- **OAuth not verified**: Need to verify OAuth client (see OAuth Verification below)

## OAuth Verification (Required for Google Calendar Access)

Since Calify uses Google Calendar API with sensitive scopes, you need to verify your OAuth consent screen:

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project (the one with your OAuth client ID)

2. **Configure OAuth Consent Screen**
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Add required information:
     - App name: Calify
     - User support email: your email
     - Developer contact: your email
     - Privacy policy URL: same as in Chrome Web Store
     - Homepage URL: Chrome Web Store listing or GitHub repo

3. **Add Scopes**
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `calendar.events` - Create calendar events
     - `calendar.readonly` - List user's calendars
     - `userinfo.email` - User identification
     - `userinfo.profile` - User identification

4. **Add Test Users** (for Testing mode)
   - Add your email and any beta testers

5. **Submit for Verification** (for Production)
   - Click "Submit for Verification"
   - Fill out questionnaire
   - May require video demo and detailed explanation
   - Verification takes 3-7 business days

## Tips for Approval

1. **Clear Description**: Be specific about what data you access and why
2. **Good Screenshots**: Show the extension in action with real examples
3. **Privacy Policy**: Be transparent about data handling
4. **Single Purpose**: Ensure extension has clear, focused purpose
5. **Minimal Permissions**: Only request permissions you actually use
6. **Professional Presentation**: Use proper grammar, formatting, and design

## After Publishing

### Update README.md
Add installation from Chrome Web Store:

```markdown
## Installation

### From Chrome Web Store
[Install Calify](https://chrome.google.com/webstore/detail/your-extension-id)

### From Source
...existing instructions...
```

### Version Updates
To publish updates:
1. Increment version in `wxt.config.ts`
2. Build: `npm run build`
3. Create new ZIP
4. Upload to Developer Dashboard
5. Submit for review

## Checklist

Before submitting:
- [ ] Extension ZIP file created
- [ ] Privacy policy hosted on public URL
- [ ] Screenshots created (at least 1, ideally 5)
- [ ] Store description written
- [ ] Icon included (128x128)
- [ ] Permissions justified
- [ ] OAuth consent screen configured
- [ ] Test extension thoroughly
- [ ] Developer account registered ($5 fee paid)

## Support

If you need help:
- [Chrome Web Store Developer Support](https://support.google.com/chrome_webstore/contact/developer_support)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/webstore/)
- [OAuth Verification Guide](https://support.google.com/cloud/answer/9110914)
