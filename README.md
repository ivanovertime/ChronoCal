# ChronoCal

ChronoCal is a Google Calendar add-on that tracks real time spent on events directly inside Google Workspace.

No external backend, no third-party storage, and no browser-side timer dependency.

## What it does

- Starts and stops tracking from the Calendar side panel.
- Supports paused, running, and stopped sessions.
- Persists session state using Apps Script UserProperties.
- Writes tracked duration to event description (toggleable).
- Adjusts the event end time to match tracked duration (configurable stop mode).
- Exports stopped sessions to Google Sheets.
- Builds a summary sheet (per-date and per-event rollups) inside the export spreadsheet.
- Settings live on a dedicated card, opened from the main panel.
- Handles event resolution across calendars and recurring instances.

## Repository structure

```text
.
|- appsscript.json
|- src/
|  |- main.gs
|  |- cards.gs
|  |- session.gs
|  |- calendar.gs
|  |- sheets.gs
|  |- i18n.gs
|  '- config.gs
|- tests/
'- docs/
   |- CLASP_SETUP.md
   |- README.md
   '- prd/
      '- README.md
```

## Prerequisites

- Node.js and npm
- Google account with Apps Script access
- clasp (used via npx)
- Optional: Nix + direnv (repo includes dev environment files)

## Quick start

```bash
direnv allow
npx @google/clasp login
```

Create a new Apps Script project and push:

```bash
npx @google/clasp create --type standalone --title "ChronoCal" --rootDir .
npx @google/clasp push
npx @google/clasp open
```

For a full deployment workflow, see [docs/CLASP_SETUP.md](docs/CLASP_SETUP.md).

## How to test

1. Push the project with clasp.
2. Open Google Calendar on desktop.
3. Open an event to load the ChronoCal contextual card.
4. Start tracking, then pause/resume/stop.
5. Save to event description or export to Sheets.

## Automated tests

The project ships a Node-based unit test suite for the pure logic (duration math,
session transitions, i18n, event-ID parsing, export rows). It runs offline with the
Apps Script globals stubbed and does not require a Google account:

```bash
npm install
npm test
```

The CI workflow runs the same checks (syntax, manifest validation, tests) on every
push and pull request.

## Configuration and permissions

- Manifest: [appsscript.json](appsscript.json)
- OAuth scopes include Calendar add-on execution, Calendar read/write, and Sheets.
- Description writing and the stop mode are configurable from the Settings card (opened from the ⋮ menu).

## Icon source attribution

- Add-on logo icon source page: [Google Fonts Material Symbols Outlined - punch_clock](https://fonts.google.com/icons?selected=Material+Symbols+Outlined:punch_clock:FILL@0;wght@700;GRAD@0;opsz@40&icon.style=Outlined&icon.query=hour&icon.size=32&icon.color=%23789DE5)
- Direct logo asset used in the manifest: [punch_clock 48px SVG](https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/punch_clock/default/48px.svg)

## Documentation

- Product requirements document: [docs/prd/README.md](docs/prd/README.md)
- Documentation index: [docs/README.md](docs/README.md)
- Deployment setup: [docs/CLASP_SETUP.md](docs/CLASP_SETUP.md)

## Contributing

- Contribution guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)
- Pull request template: [.github/pull_request_template.md](.github/pull_request_template.md)
- Issue templates: [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE)

## License

Licensed under MIT. See [LICENSE](LICENSE).

## Status

Current state: functional MVP plus pause/resume and Sheets export flows.

Planned evolution is documented in the PRD.
