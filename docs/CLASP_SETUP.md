# CLASP Setup & Deployment Guide for ChronoCal

This guide outlines how to manage, develop, and deploy ChronoCal to Google Apps Script using Google's Command Line Apps Script Projects (`clasp`) tool.

---

## 1. Development Shell

Enter the project repository and allow direnv (or enter via your Nix development shell):

```bash
cd /home/ivan/Source/ChronoCal
direnv allow
```

This ensures Node.js (>=18) and npm are available in your path.

---

## 2. Authenticate with Google Apps Script

Run the clasp login command once:

```bash
npx @google/clasp login
```

This opens a browser window prompting you to log into the Google account where your Apps Script project lives. The OAuth credentials will be stored securely in `~/.clasprc.json`.

---

## 3. Create or Link Your Project

### Option A: Create a New Standalone Project
```bash
npx @google/clasp create --type standalone --title "ChronoCal" --rootDir .
```

### Option B: Link an Existing Apps Script Project
If you already have a script created in Apps Script:
```bash
npx @google/clasp clone <SCRIPT_ID> --rootDir .
```

Ensure `.clasp.json` contains:
```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "."
}
```

---

## 4. Development & Verification Workflow

Before pushing changes to Google Apps Script, always run the automated verification suite:

```bash
# Run 66 offline unit tests and syntax validation
npm test && npm run lint

# (Optional) Rebuild branded vector & PNG assets
npm run build:assets
```

---

## 5. Push Local Code to Apps Script

Upload your local code (`src/*.gs` and `appsscript.json`) to Google:

```bash
npm run push
# Equivalent to: npx @google/clasp push
```

Check the sync status between local and remote files:
```bash
npm run status
```

Open the project in the Google Apps Script web editor:
```bash
npm run open
```

---

## 6. Testing in Google Calendar Developer Mode

You can test ChronoCal directly inside your Google Calendar desktop web interface without needing an approved Marketplace listing:

1. Push your local code using `npm run push`.
2. Open [Google Calendar](https://calendar.google.com/) in your browser.
3. Click the **Gear icon (⚙)** in the top right -> **Settings**.
4. In the left sidebar, click **Add-ons**.
5. Check the box for **Enable developer add-ons execution**.
6. The head deployment (`@HEAD`) will automatically appear as an icon on your right-hand companion sidebar.
7. Click the ChronoCal icon to open the side panel, or open any event on your calendar to trigger the contextual card.

---

## 7. Versioning & Production Deployments

When preparing a release for the Google Workspace Marketplace:

```bash
# Create an immutable version tag
npx @google/clasp version "v1.0.0 Production Release"

# List active deployment IDs
npm run deployments
```

Use the Deployment ID from `npm run deployments` when configuring the **Google Workspace Marketplace SDK** in the Google Cloud Console. For complete Marketplace publication instructions, see [MARKETPLACE_PUBLISHING.md](MARKETPLACE_PUBLISHING.md).
