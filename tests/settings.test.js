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

test('onStopModeChange() saves the selected stop mode and rebuilds', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({}));

  const selection = (stopMode) => ({
    commonEventObject: { formInputs: { stopMode: { stringInputs: { values: [stopMode] } } } }
  });

  const first = ctx.onStopModeChange(selection('END_TIME'));
  assert.equal(ctx.getSettings_().stopMode, 'END_TIME');
  assert.ok(first.__notification.__text.includes('hora de fin'));
  assert.ok(first.__nav.some((entry) => entry[0] === 'updateCard'));

  ctx.onStopModeChange(selection('BOTH'));
  assert.equal(ctx.getSettings_().stopMode, 'BOTH');

  ctx.onStopModeChange(selection('INVALID'));
  assert.equal(ctx.getSettings_().stopMode, 'BOTH');
});

test('onToggleSheetsExport() flips the setting', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({}));

  ctx.onToggleSheetsExport({ commonEventObject: {} });
  assert.equal(ctx.getSettings_().sheetsExportEnabled, true);

  ctx.onToggleSheetsExport({ commonEventObject: {} });
  assert.equal(ctx.getSettings_().sheetsExportEnabled, false);
});

test('onLanguageChange() sets the language and forces manual mode', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_SETTINGS', JSON.stringify({}));

  const response = ctx.onLanguageChange({
    commonEventObject: { formInputs: { language: { stringInputs: { values: ['en'] } } } }
  });
  assert.equal(ctx.getSettings_().userLocale, 'en');
  assert.equal(ctx.getSettings_().localeSource, 'manual');
  assert.ok(response.__nav.some((entry) => entry[0] === 'updateCard'));
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