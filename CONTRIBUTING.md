# Contributing to ChronoCal

Thank you for your interest in improving ChronoCal! ChronoCal is a community-driven, privacy-first open-source Google Workspace Add-on.

---

## 1. Development Setup

1. Clone the repository and enter the directory:
   ```bash
   git clone https://github.com/ivanovertime/ChronoCal.git
   cd ChronoCal
   ```
2. Allow `direnv` or enter your Nix dev shell:
   ```bash
   direnv allow
   ```
3. Authenticate with Google Apps Script:
   ```bash
   npx @google/clasp login
   ```

---

## 2. Typical Workflow

1. Create a feature branch from `trunk`:
   ```bash
   git checkout -b feature/my-enhancement
   ```
2. Keep changes focused, well-documented, and small.
3. If changing UI or i18n text, update both Spanish (`es`) and English (`en`) bundles in `src/i18n.gs`.
4. Add automated test coverage in `tests/` for any new logic or action handlers.
5. If modifying branding assets or SVGs, run:
   ```bash
   npm run build:assets
   ```
6. Verify your changes pass all tests and lint checks:
   ```bash
   npm test && npm run lint
   ```
7. Open a Pull Request with a clear description and screenshots where applicable.

---

## 3. Testing Checklist

Before opening or merging a Pull Request, verify:

- [ ] `npm test` passes all 66 offline unit tests.
- [ ] `npm run lint` confirms clean syntax for all `src/*.gs` files and JSON manifests.
- [ ] Add-on loads in Google Calendar developer mode without execution errors.
- [ ] Primary buttons render with filled styling; secondary actions render as clean text buttons.
- [ ] Start, Pause, Resume, Stop, and Discard flows work smoothly.
- [ ] Description modification and End-Time adjustment update calendar events accurately without duplicate tags.
- [ ] Sheets export properly formats rows and updates the summary sheet.
- [ ] Onboarding section renders correctly when opening the side panel without an active event.

---

## 4. Code Style & Architecture Guidelines

- **Declarative UI**: Google Workspace uses `CardService`. There is no DOM or live interval timers. UI updates only occur on user interaction or manual refresh.
- **Button Limits**: A `CardService.ButtonSet` supports a maximum of **3 buttons**. Do not add a 4th button to any set.
- **Drift-Proof Math**: Always calculate durations dynamically using absolute timestamps (`Date.now() - started_at_ms + elapsed_ms`).
- **Single Active Session**: Only one timer may run at a time to prevent accidental background runaways.

---

## 5. Security & Privacy Disclosures

- Never commit secrets, OAuth tokens, personal calendar IDs, or private URLs.
- ChronoCal strictly adheres to a zero-external-servers policy. PRs adding external network calls (`UrlFetchApp`) to third-party endpoints will not be accepted.
- If you discover a security vulnerability, please report it privately to the maintainers rather than creating a public issue.