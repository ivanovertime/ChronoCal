# Privacy Policy for ChronoCal

**Last Updated**: September 2026

ChronoCal ("the Add-on", "we", "our") is a Google Calendar Workspace Add-on built with Google Apps Script to provide privacy-first, local time tracking directly inside the Google Calendar interface.

Your privacy and data sovereignty are our core design principles. ChronoCal operates **100% within your Google Workspace account**. We do not run external servers, we do not maintain third-party databases, and we never collect, monetize, or transmit your personal or calendar data.

---

## 1. Information We Access and How It Is Used

ChronoCal only accesses data strictly necessary to provide time tracking functionality:

| Data Type | How It Is Used | Where It Is Stored |
| :--- | :--- | :--- |
| **Calendar Event Identifiers & Titles** | Identifies which calendar event you are currently tracking time against. | Temporarily cached in Google Apps Script `UserProperties` inside your Google account. Never sent to any external server. |
| **Event Start & End Times** | Computes duration and allows adjusting event end times when configured in your stop mode. | Read and updated directly via Google Calendar API. |
| **Event Descriptions** | Appends actual duration lines (e.g., `⌛ Duración Real: 01:30:00`) when you choose to save a session. | Stored solely on your calendar event in Google Calendar. |
| **Session Timestamps** | Measures elapsed time (`started_at_ms`, `elapsed_ms`) using absolute timestamps. | Stored in `UserProperties` within your personal Google account. |
| **Spreadsheet IDs & Sheets** | Appends time-tracking rows and summary roll-ups if you explicitly enable Google Sheets export. | Stored in the Google Sheet you specify or create in your Google Drive. |

---

## 2. Zero External Data Transfer

- **No Third-Party Servers**: ChronoCal has zero external backend infrastructure, telemetry servers, or analytics databases.
- **No External Network Calls**: The Add-on code does not use `UrlFetchApp` to communicate with external APIs. All execution takes place within Google's secure Apps Script sandbox.
- **No Advertising or Data Selling**: We do not sell, rent, trade, or monetize user data under any circumstances.

---

## 3. Google API Limited Use Disclosure

ChronoCal's use and transfer to any other app of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the **Limited Use** requirements.

Specifically:
1. We only request OAuth scopes required to perform user-facing time-tracking features.
2. We do not transfer your data to external third parties.
3. We do not use your data for advertising, market research, or training artificial intelligence / machine learning models.
4. Human beings do not read your calendar events or tracked data.

---

## 4. Permissions & OAuth Scopes

ChronoCal requests the following scopes:

| OAuth Scope | Purpose |
| :--- | :--- |
| `https://www.googleapis.com/auth/calendar.addons.execute` | Required to run the Add-on within the Google Calendar side panel. |
| `https://www.googleapis.com/auth/calendar.addons.current.event.read` | Reads the currently opened event ID, title, and start time to display the contextual tracking card. |
| `https://www.googleapis.com/auth/calendar.addons.current.event.write` | Allows updating the contextual event card UI and writing session results back to the event. |
| `https://www.googleapis.com/auth/calendar` | Resolves recurring event instances, matches events across secondary calendars, and updates descriptions or end times upon session completion. |
| `https://www.googleapis.com/auth/spreadsheets` | *(Optional feature)* Allows creating an export spreadsheet or appending session rows and summary roll-ups if Google Sheets export is enabled in Settings. |

---

## 5. User Control & Data Retention

- **Discarding Sessions**: You can discard any active or stopped session at any time by clicking "Discard" directly from the side panel. This immediately purges the session data from `UserProperties`.
- **Resetting Settings**: Disabling features (such as Sheets export or description writing) instantly stops any data modification for those targets.
- **Uninstalling**: Uninstalling ChronoCal from Google Calendar automatically revokes all OAuth tokens and access permissions. `UserProperties` data tied to the script is discarded in accordance with Google Workspace lifecycle policies.

---

## 6. Security

All computation and storage are governed by Google Cloud and Google Workspace security infrastructure. ChronoCal inherits all security, encryption in transit, and encryption at rest standards enforced by Google.

---

## 7. Changes to This Policy

If we update this Privacy Policy, the revised version will be published in this repository with an updated revision date. Material changes will be communicated via release notes.

---

## 8. Contact

For any questions or privacy inquiries regarding ChronoCal, please open an issue on GitHub:
- **Repository**: [https://github.com/ivanovertime/ChronoCal](https://github.com/ivanovertime/ChronoCal)
- **Maintainer**: Iván ([ivanovertime](https://github.com/ivanovertime))
