'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/load-source.js');

test('t_() interpolates templates', () => {
  const { ctx } = loadSource();
  assert.equal(ctx.t_('notify.exportManySuccess', { count: 3 }, 'en'), 'Exported 3 sessions to Google Sheets.');
  assert.equal(ctx.t_('notify.exportOneSuccess', { count: 1 }, 'es'), 'Sesión exportada a Google Sheets (1).');
});

test('t_() falls back to default locale for missing keys in en', () => {
  const { ctx } = loadSource();
  ctx.CHRONOCAL_I18N.en.notify.settingsSaved = '';
  assert.equal(ctx.t_('notify.settingsSaved', null, 'en'), 'Ajustes guardados.');
});

test('t_() returns the key when missing everywhere', () => {
  const { ctx } = loadSource();
  assert.equal(ctx.t_('missing.key.here', null, 'es'), 'missing.key.here');
});

test('getSupportedLocale_() normalizes locale codes', () => {
  const { ctx } = loadSource();
  assert.equal(ctx.getSupportedLocale_('es-419'), 'es');
  assert.equal(ctx.getSupportedLocale_('EN_us'), 'en');
  assert.equal(ctx.getSupportedLocale_('fr'), '');
  assert.equal(ctx.getSupportedLocale_(''), '');
});

test('getDurationTagVariants_() includes legacy unaccented tags', () => {
  const { ctx } = loadSource();
  const variants = ctx.getDurationTagVariants_();
  assert.ok(variants.includes('Duración real:'));
  assert.ok(variants.includes('Duracion real:'));
  assert.ok(variants.includes('Actual duration:'));
});

test('getStopModeLabel_() and notification keys map stop modes', () => {
  const { ctx } = loadSource();
  assert.equal(ctx.getStopModeLabel_('DESCRIPTION', 'en'), 'Description');
  assert.equal(ctx.getStopModeLabel_('END_TIME', 'es'), 'Ajustar hora de fin');
  assert.equal(ctx.getStopModeLabel_('BOTH', 'en'), 'Description + end time');
  assert.equal(ctx.getStopModeNotificationKey_('END_TIME'), 'notify.stopModeChangedEndTime');
  assert.equal(ctx.getStopModeNotificationKey_('BOTH'), 'notify.stopModeChangedBoth');
  assert.equal(ctx.getStopModeNotificationKey_('DESCRIPTION'), 'notify.stopModeChangedDescription');
});

test('getSummaryHeaders_() returns five headers', () => {
  const { ctx } = loadSource();
  assert.equal(ctx.getSummaryHeaders_('en').length, 5);
});

test('resolveLocale_() respects manual override', () => {
  const { ctx } = loadSource();
  const settings = { userLocale: 'en', localeSource: 'manual' };
  assert.equal(ctx.resolveLocale_(null, settings), 'en');
});

test('getDateFormatPatternForLocale_()', () => {
  const { ctx } = loadSource();
  assert.equal(ctx.getDateFormatPatternForLocale_('en'), 'yyyy-MM-dd');
  assert.equal(ctx.getDateFormatPatternForLocale_('es'), 'dd/MM/yyyy');
});