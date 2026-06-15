# CLASP setup for ChronoCal

This repository is prepared for Google Apps Script deployment with `clasp`.

## 1. Enter the dev shell

```bash
cd /home/ivan/Source/ChronoCal
direnv allow
```

The shell provides Node/npm. You can run `clasp` with `npx`.

## 2. Authenticate once

```bash
npx @google/clasp login
```

## 3. Create or link the Apps Script project

Option A: create a new standalone Apps Script project from this repo.

```bash
npx @google/clasp create --type standalone --title "ChronoCal" --rootDir .
```

Option B: link an existing project.

```bash
npx @google/clasp clone <SCRIPT_ID> --rootDir .
```

After create/clone, verify `.clasp.json` points to `rootDir: "."`.

## 4. Push and open

```bash
npx @google/clasp push
npx @google/clasp open
```

## 5. Deploy a test version

```bash
npx @google/clasp version "MVP scaffold"
npx @google/clasp deployments
```

## Notes

- `appsscript.json` and `src/*.gs` are the deployable files.
- `.claspignore` excludes Nix and local shell artifacts.
- Keep secrets out of this repo. `clasp` auth tokens are stored in your user profile, not in the project folder.
