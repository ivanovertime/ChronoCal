'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/load-source.js');

test('normalizeSettings_() applies defaults and validates fields', () => {
  const { ctx } = loadSource();
  const defaults = ctx.normalizeSettings_(null);
  assert.equal(defaults.stopMode, 'DESCRIPTION');
  assert.equal(defaults.writeDescription, true);
  assert.equal(defaults.sheetsExportEnabled, false);
  assert.equal(defaults.sheetsSheetName, 'ChronoCal');
  assert.equal(defaults.userLocale, 'es');

  const custom = ctx.normalizeSettings_({
    stopMode: 'END_TIME',
    sheetsExportEnabled: true,
    sheetsSpreadsheetId: 'ABC123',
    writeDescription: false
  });
  assert.equal(custom.stopMode, 'END_TIME');
  assert.equal(custom.sheetsExportEnabled, true);
  assert.equal(custom.writeDescription, false);

  const invalid = ctx.normalizeSettings_({ stopMode: 'INVALID_MODE' });
  assert.equal(invalid.stopMode, 'DESCRIPTION');
});

test('onToggleStopMode() cycles DESCRIPTION -> END_TIME -> BOTH and notifies', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({}));

  const first = ctx.onToggleStopMode({ commonEventObject: {} });
  assert.equal(ctx.getSettings_().stopMode, 'END_TIME');
  assert.ok(first.__notification.__text.includes('hora de fin'));

  const second = ctx.onToggleStopMode({ commonEventObject: {} });
  assert.equal(ctx.getSettings_().stopMode, 'BOTH');

  const third = ctx.onToggleStopMode({ commonEventObject: {} });
  assert.equal(ctx.getSettings_().stopMode, 'DESCRIPTION');
});

test('onToggleSheetsExport() flips the setting', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({}));

  ctx.onToggleSheetsExport({ commonEventObject: {} });
  assert.equal(ctx.getSettings_().sheetsExportEnabled, true);

  ctx.onToggleSheetsExport({ commonEventObject: {} });
  assert.equal(ctx.getSettings_().sheetsExportEnabled, false);
});

test('getDefaultSettings_() and saveSettings_() round-trip', () => {
  const { ctx, store } = loadSource();
  const settings = ctx.getDefaultSettings_();
  settings.stopMode = 'BOTH';
  ctx.saveSettings_(settings);
  const restored = JSON.parse(store.getProperty('CHRONOCAL_SETTINGS'));
  assert.equal(restored.stopMode, 'BOTH');
  assert.equal(restored.sheetsExportEnabled, false);
});