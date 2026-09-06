'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource, createPropertiesStore } = require('./helpers/load-source.js');

function toHost(value) {
  return JSON.parse(JSON.stringify(value));
}

function exportSession(overrides) {
  return Object.assign({
    active_event_id: 'evt-1',
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

test('buildSessionExportRow_() returns an eight-column row', () => {
  const { ctx } = loadSource();
  const row = ctx.buildSessionExportRow_(exportSession(), '2026-01-01T10:00:00.000Z', 'en');
  assert.equal(row.length, 8);
  assert.equal(row[1], 'Client call');
  assert.equal(row[2], 'primary');
  assert.equal(row[3], 'Stopped');
  assert.equal(row[4], '01:00:00');
  assert.equal(row[5], 60);
});

test('buildSummaryRows_() groups by date and by event', () => {
  const { ctx } = loadSource();
  const sessions = [
    exportSession({ event_title: 'Alpha', started_at_iso: '2026-01-02T09:00:00.000Z', elapsed_ms: 3600000 }),
    exportSession({ event_title: 'Alpha', started_at_iso: '2026-01-02T14:00:00.000Z', elapsed_ms: 1800000 }),
    exportSession({ event_title: 'Beta', started_at_iso: '2026-01-03T09:00:00.000Z', elapsed_ms: 600000 })
  ];

  const rows = ctx.buildSummaryRows_(sessions, 'en');
  assert.equal(rows.length, 5); // header + 2 date rows + 2 event rows
  assert.equal(rows[0].length, 5);

  // Date rows sorted newest first (skip the header).
  const dateInfo = rows.slice(1).filter((row) => row[0]);
  assert.equal(dateInfo.length, 2);
  assert.equal(dateInfo[0][0], '2026-01-03');
  assert.equal(dateInfo[0][3], '00:10:00');
  assert.equal(dateInfo[1][0], '2026-01-02');
  assert.equal(dateInfo[1][3], '01:30:00');

  // Event rows sorted by total duration desc (skip the header).
  const eventInfo = rows.slice(1).filter((row) => row[1]);
  assert.equal(eventInfo.length, 2);
  assert.equal(eventInfo[0][1], 'Alpha');
  assert.equal(eventInfo[0][3], '01:30:00');
  assert.equal(eventInfo[1][1], 'Beta');
});

test('buildSummaryRows_() handles empty sessions', () => {
  const { ctx } = loadSource();
  const rows = ctx.buildSummaryRows_([], 'es');
  assert.deepEqual(toHost(rows), toHost([ctx.getSummaryHeaders_('es')]));
});

test('createExportSpreadsheet_() stores id, url, and saves settings', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({}));
  const spreadsheet = ctx.createExportSpreadsheet_(ctx.getSettings_(), 'en');
  assert.equal(spreadsheet.getId(), 'NEW_SPREADSHEET_ID');
  assert.equal(ctx.getSettings_().sheetsSpreadsheetId, 'NEW_SPREADSHEET_ID');
  assert.equal(ctx.getSettings_().sheetsSpreadsheetUrl.includes('NEW_SPREADSHEET_ID'), true);
});

test('export gating via settings uses createPropertiesStore isolation', () => {
  const store = createPropertiesStore();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({ sheetsExportEnabled: false }));
  const { ctx } = loadSource({ store });
  const settings = ctx.getSettings_();
  assert.equal(settings.sheetsExportEnabled, false);
});