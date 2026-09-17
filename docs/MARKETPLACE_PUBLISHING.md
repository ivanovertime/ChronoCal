# Google Workspace Marketplace Publishing Guide for ChronoCal

This guide outlines the exact step-by-step procedure to publish ChronoCal to the **Google Workspace Marketplace**, including Google Cloud Project (GCP) setup, OAuth verification, scope justifications, and store listing assets.

---

## 1. Google Cloud Project (GCP) Setup

By default, Apps Script projects are linked to a hidden, default GCP project. To publish on the Marketplace, you must link ChronoCal to a **Standard Google Cloud Project**:

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `ChronoCal` (or select an existing standard project with billing enabled).
3. Copy your **Project Number** from the Project Info card.
4. Open the Apps Script editor for ChronoCal (`npm run open`).
5. In the left navigation, click **Project Settings** (⚙).
6. Under **Google Cloud Platform (GCP) Project**, click **Change project**.
7. Paste your GCP **Project Number** and confirm.
8. Enable the required APIs in [GCP Console > APIs & Services > Library](https://console.cloud.google.com/apis/library):
   - **Google Workspace Marketplace SDK**
   - **Google Calendar API**
   - **Google Sheets API**

---

## 2. OAuth Consent Screen Configuration

In [GCP Console > APIs & Services > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent):

### Basic Information
- **User Type**: External (allows any Google Calendar user to install).
- **App name**: `ChronoCal - Time Tracker for Google Calendar`
- **User support email**: Your support or maintainer email.
- **App logo**: Upload [assets/icon-128.png](../assets/icon-128.png) (128x128 PNG).
- **Application home page**: `https://ivanovertime.github.io/ChronoCal` (or repository URL).
- **Application privacy policy link**: `https://ivanovertime.github.io/ChronoCal/docs/PRIVACY.html` (or raw GitHub markdown link).
- **Application terms of service link**: `https://ivanovertime.github.io/ChronoCal/docs/TERMS.html`.
- **Authorized domains**: `github.io` (or your verified domain).
- **Developer contact information**: Your developer email.

---

## 3. Scopes & Justification for Google Verification

Because ChronoCal modifies calendar events and optionally creates Sheets rows, Google requires **OAuth App Verification**:

### Scopes Requested in `appsscript.json`:
1. `https://www.googleapis.com/auth/calendar.addons.execute`
2. `https://www.googleapis.com/auth/calendar.addons.current.event.read`
3. `https://www.googleapis.com/auth/calendar.addons.current.event.write`
4. `https://www.googleapis.com/auth/calendar` *(Restricted)*
5. `https://www.googleapis.com/auth/spreadsheets` *(Sensitive)*

### Copy-Paste Justification for Google Review:

> **Why ChronoCal needs Calendar scope (`.../auth/calendar`)**:
> ChronoCal is a local time tracker designed to measure actual time spent on calendar events. The Add-on needs read and write access to Calendar events to:
> 1. Resolve recurring event instances and secondary calendars when users track time across multiple schedules.
> 2. Write the user's recorded duration line directly into the event description upon session completion (e.g., `⌛ Duración Real: 01:30:00`).
> 3. Adjust the calendar event end time to reflect real duration when the user explicitly enables "Adjust end time" in settings.
> All data processing occurs 100% inside Google Apps Script within the user's Google account; no data is ever transmitted to external servers.

> **Why ChronoCal needs Sheets scope (`.../auth/spreadsheets`)**:
> The Sheets scope is used solely for the optional "Export to Sheets" feature. If enabled by the user, ChronoCal appends completed session rows (Date, Event Title, Duration, Start/End times) and builds a local summary sheet. The spreadsheet remains in the user's personal Google Drive.

---

## 4. YouTube Screencast / Demo Video Requirements

Google OAuth verification **strictly requires a public YouTube unlisted video** demonstrating the app:

### Demo Video Checklist:
- [ ] **Address Bar Visible**: Start the recording with your browser address bar fully visible, showing the Google OAuth Client ID in the URL (`client_id=...`).
- [ ] **Consent Screen**: Show the user logging in and granting permissions to ChronoCal.
- [ ] **Calendar Event Tracking**:
  1. Open Google Calendar web.
  2. Open an event and load the ChronoCal side panel.
  3. Click **Start** to begin tracking.
  4. Pause/resume the session.
  5. Click **Stop** and **Save to Event**; show that the event description updates with the duration.
- [ ] **Settings & Stop Modes**: Open Settings, switch stop mode to "Adjust end time", and demonstrate an event's end time adjusting.
- [ ] **Sheets Export**: Show enabling Sheets export, creating a spreadsheet, and seeing the exported row and summary roll-up in Google Sheets.
- [ ] **Explain Zero Servers**: Verbally or via captions, state that all data remains inside the user's Google account.

---

## 5. Google Workspace Marketplace SDK Configuration

Navigate to **GCP Console > APIs & Services > Google Workspace Marketplace SDK**:

### A. App Configuration
- **App Visibility**: Public (or Unlisted during testing).
- **Installation Settings**: Individual install (users can install directly) and/or Admin install.
- **App Integration**: Check **Google Workspace Add-on**.
- **Deployment ID**: Paste your latest Apps Script Deployment ID (run `npm run deployments` to view).

### B. Store Listing
- **Application Name**: `ChronoCal - Time Tracker for Google Calendar`
- **Short Description (≤ 80 chars)**:
  `Privacy-first time tracking inside Google Calendar. No external servers or timers.`
- **Detailed Description**:
  ```markdown
  ChronoCal is a privacy-first, local time tracker built directly into Google Calendar.

  Track real time spent on meetings, tasks, and focus blocks right inside your side panel without external subscriptions, third-party databases, or browser-side timer loops.

  KEY FEATURES:
  • Contextual Tracking: Starts and stops tracking directly from the active calendar event.
  • 100% Private & Native: Operates entirely inside Google Apps Script. Your calendar data never leaves Google.
  • Automatic Sync: Appends real duration to the event description or automatically adjusts the event end time.
  • Sheets Analytics: Export stopped sessions into a formatted Google Spreadsheet with daily and event summaries.
  • Multi-Language: Full native support for English and Spanish.
  • Robust Time Math: Calculates duration via absolute timestamps; immune to tab suspension, browser restarts, or sleep mode.
  ```
- **Graphic Assets**:
  - **Application Icon (128x128)**: Upload [assets/icon-128.png](../assets/icon-128.png).
  - **Promotional Card (440x280)**: Upload [assets/promo-card-440x280.png](../assets/promo-card-440x280.png).
  - **Screenshots (1280x800)**: Capture and upload 3-5 screenshots showing the side panel in action.
- **Category**: Productivity / Business Tools.

---

## 6. Release Commands Quick Reference

From your terminal in `/home/ivan/Source/ChronoCal`:

```bash
# 1. Run offline verification and build assets
npm test && npm run lint
npm run build:assets

# 2. Push latest code to Google Apps Script
npm run push

# 3. Create a tagged version for Marketplace deployment
npx @google/clasp version "v1.0.0 Production Release"

# 4. View deployment ID to enter in Marketplace SDK
npm run deployments
```

Once submitted, Google typically reviews OAuth and Marketplace submissions within **3 to 7 business days**.
