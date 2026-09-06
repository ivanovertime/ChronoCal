'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource, makeRichSpreadsheetStub } = require('./helpers/load-source.js');

function stoppedSession(overrides) {
  return Object.assign({
    active_event_id: 'evt-2',
    calendar_id: 'primary',
    event_title: 'Client call',
    time_zone: 'Etc/UTC',
    started_at_ms: 1000,
    started_at_iso: '2026-01-01T09:00:00.000Z',
    elapsed_ms: 3600000,
    status: 'STOPPED',
    stopped_at_iso: '2026-01-01T10:00:00.000Z'
  }, overrides || {});
}

function eventParams(eventId) {
  return {
    commonEventObject: {
      parameters: {
        eventId: eventId,
        calendarId: 'primary',
        eventTitle: 'Client call',
        timeZone: 'Etc/UTC'
      }
    }
  };
}

test('onExportToSheets() is gated when export is disabled and keeps sessions', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SESSIONS', JSON.stringify([stoppedSession()]));
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en', sheetsExportEnabled: false }));

  const response = ctx.onExportToSheets({ commonEventObject: {} });
  assert.equal(response.__notification.__text, 'Enable Sheets export from the settings.');
  assert.equal(ctx.getSessions_().length, 1);
});

test('onExportToSheets() exports stopped sessions and removes them when enabled', () => {
  const { ctx, store } = loadSource();
  const rich = makeRichSpreadsheetStub();
  ctx.SpreadsheetApp = rich;

  store.setProperty('CHRONOCAL_SESSIONS', JSON.stringify([stoppedSession()]));
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({
    userLocale: 'en',
    sheetsExportEnabled: true,
    sheetsSpreadsheetId: 'SHEET_ID'
  }));

  const response = ctx.onExportToSheets({ commonEventObject: {} });
  assert.ok(response.__notification.__text.includes('Exported 1 sessions'));
  assert.ok(response.__notification.__text.includes('https://docs.google.com'));
  assert.equal(ctx.getSessions_().length, 0);
  assert.ok(rich.sheets['ChronoCal'].state.values.length >= 2);
  assert.ok(rich.sheets['ChronoCal Summary']);
});

test('onExportSessionToSheets() is gated when export is disabled', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SESSIONS', JSON.stringify([stoppedSession()]));
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en', sheetsExportEnabled: false }));

  const response = ctx.onExportSessionToSheets(eventParams('evt-2'));
  assert.equal(response.__notification.__text, 'Enable Sheets export from the settings.');
  assert.equal(ctx.getSessions_().length, 1);
});

test('onSaveSession() blocks DESCRIPTION mode when description writing is disabled', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SESSIONS', JSON.stringify([stoppedSession()]));
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en', writeDescription: false }));

  const response = ctx.onSaveSession(eventParams('evt-2'));
  assert.equal(response.__notification.__text, 'Description editing is disabled. Export to Sheets instead.');
  assert.equal(ctx.getSessions_().length, 1);
});

test('onSaveSession() notices when there is no session for the event', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SESSIONS', '[]');
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en' }));

  const response = ctx.onSaveSession(eventParams('no-such-event'));
  assert.equal(response.__notification.__text, 'There is no session to save for this event.');
});

test('onDiscardSession() removes the session', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SESSIONS', JSON.stringify([stoppedSession()]));
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en' }));

  const response = ctx.onDiscardSession(eventParams('evt-2'));
  assert.equal(response.__notification.__text, 'Session discarded.');
  assert.equal(ctx.getSessions_().length, 0);
});