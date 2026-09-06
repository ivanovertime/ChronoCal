'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource, makeRichSpreadsheetStub, makeRichCalendarStub } = require('./helpers/load-source.js');

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

test('onOpenSettings() displays the settings card via universal action', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en' }));

  const response = ctx.onOpenSettings({ commonEventObject: {} });
  assert.ok(response.__cards && response.__cards.length >= 1);
  assert.equal(response.__notification, undefined);
});

test('onCloseSettings() rebuilds and updates the base card', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en' }));

  const response = ctx.onCloseSettings({ commonEventObject: {} });
  assert.ok(response.__nav.some((entry) => entry[0] === 'updateCard'));
});

test('onSaveSettings() saves, updates the base card, and notifies', () => {
  const { ctx, store } = loadSource();
  const longId = '1AbCdefG1234567890XYZabcDEF456789XYZ';
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en', sheetsSpreadsheetId: longId }));

  const response = ctx.onSaveSettings({
    commonEventObject: {
      formInputs: {
        sheetsTarget: { input: { value: longId } },
        sheetName: { input: { value: 'My Log' } }
      }
    }
  });
  assert.equal(ctx.getSettings_().sheetsSheetName, 'My Log');
  assert.ok(response.__nav.some((entry) => entry[0] === 'updateCard'));
  assert.equal(response.__notification.__text, 'Settings saved.');
});

test('onSaveSettings() rejects an invalid spreadsheet reference and stays', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en' }));

  const response = ctx.onSaveSettings({
    commonEventObject: {
      formInputs: {
        sheetsTarget: { input: { value: 'not a valid reference' } }
      }
    }
  });
  assert.equal(response.__notification.__text, 'Invalid spreadsheet reference.');
  assert.equal(response.__nav.length, 0);
});

test('onResumeAll() resumes all paused sessions', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SESSIONS', JSON.stringify([
    { active_event_id: 'a', calendar_id: 'primary', status: 'PAUSED', started_at_ms: 1000 },
    { active_event_id: 'b', calendar_id: 'primary', status: 'PAUSED', started_at_ms: 1000 },
    { active_event_id: 'c', calendar_id: 'primary', status: 'STOPPED', stopped_at_iso: '2026-01-01T10:00:00.000Z' }
  ]));
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en' }));

  const response = ctx.onResumeAll({ commonEventObject: {} });
  const sessions = ctx.getSessions_();
  assert.equal(sessions.filter((s) => s.status === 'RUNNING').length, 2);
  assert.equal(response.__notification.__text, 'Resumed 2 events.');
});

test('onResumeAll() notifies when nothing is paused', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SESSIONS', '[]');
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en' }));

  const response = ctx.onResumeAll({ commonEventObject: {} });
  assert.equal(response.__notification.__text, 'There are no paused events.');
});

test('onFinishWork() stops and applies the stop mode to active sessions', () => {
  const { ctx, store, setNow } = loadSource({ now: 3720000 });
  setNow(3720000);
  const calendar = makeRichCalendarStub();
  ctx.Calendar = calendar;
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en', stopMode: 'DESCRIPTION' }));
  store.setProperty('CHRONOCAL_SESSIONS', JSON.stringify([
    {
      active_event_id: 'evt-2',
      calendar_id: 'primary',
      event_title: 'Client call',
      time_zone: 'Etc/UTC',
      started_at_ms: 120000,
      elapsed_ms: 0,
      status: 'RUNNING'
    }
  ]));

  const response = ctx.onFinishWork({ commonEventObject: {} });
  const sessions = ctx.getSessions_();
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].status, 'STOPPED');
  assert.ok(calendar.events.events['evt-2'].description.includes('Actual duration:'));
  assert.equal(response.__notification.__text, 'Workday finished · 1h 0m.');
});

test('onFinishWork() notifies when nothing is active', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SESSIONS', '[]');
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ userLocale: 'en' }));

  const response = ctx.onFinishWork({ commonEventObject: {} });
  assert.equal(response.__notification.__text, 'There are no active events.');
});