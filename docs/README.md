# ChronoCal Documentation Index

Welcome to the ChronoCal documentation directory. This collection contains the architecture, development setup, publishing guide, and compliance documentation.

---

## Documentation Directory

| Document | Description |
| :--- | :--- |
| [**Product Requirements Document (PRD)**](prd/README.md) | Original product specifications, user personas, architecture constraints, and functional requirements. |
| [**CLASP Setup & Deployment Guide**](CLASP_SETUP.md) | Instructions for authenticating with `clasp`, managing script environments, and deploying Apps Script code. |
| [**Marketplace Publishing Guide**](MARKETPLACE_PUBLISHING.md) | Comprehensive walkthrough for Google Cloud Project (GCP) linkage, OAuth verification, scope justifications, and store listing setup. |
| [**Privacy Policy**](PRIVACY.md) | Public privacy policy detailing local storage in `UserProperties`, zero external servers, and Google Limited Use compliance. |
| [**Terms of Service**](TERMS.md) | Standard terms of service, open-source MIT license, disclaimers, and limitation of liability. |
| [**Contributing Guide**](../CONTRIBUTING.md) | Guidelines for contributing code, testing workflows, and opening pull requests. |

---

## Key Technical Notes

- **Runtime**: Google Apps Script (V8 Runtime).
- **UI System**: Declarative Google Workspace `CardService` (no live ticker loops, event-driven renders).
- **Duration Math**: Pure absolute timestamps (`Date.now() - started_at_ms + elapsed_ms`) preventing timer drift during tab suspension or sleep.
- **Offline Tests**: Pure Node.js unit tests (`node --test`) stubbing Apps Script globals with zero external network dependencies.