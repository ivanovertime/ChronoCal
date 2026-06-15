# Contributing to ChronoCal

Thanks for your interest in improving ChronoCal.

## Development setup

1. Enter the repository.
2. Load the local environment.
3. Authenticate with clasp.

```bash
cd /home/ivan/Source/ChronoCal
direnv allow
npx @google/clasp login
```

## Typical workflow

1. Create a branch from trunk.
2. Keep changes focused and small.
3. Update docs when behavior or setup changes.
4. Push with clear commit messages.
5. Open a pull request with context and test notes.

## Code style

- Use clear function names and small helper functions.
- Keep behavior changes backward compatible when practical.
- Avoid unrelated refactors in feature or bugfix PRs.

## Testing checklist

Before opening a PR, verify:

- Add-on card loads in Google Calendar event context.
- Start, pause/resume, stop flow works.
- Save-to-description works when enabled.
- Sheets export works and creates rows as expected.
- Error paths keep sessions when save/export fails.

## Pull request checklist

- Describe what changed and why.
- Add steps to reproduce or validate.
- Include screenshots for card UI changes when applicable.
- Link related issues.

## Security

Do not commit secrets, personal tokens, or private IDs.

If you find a sensitive issue, report it privately to project maintainers instead of opening a public issue.