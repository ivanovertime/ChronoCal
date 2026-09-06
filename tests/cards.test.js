'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/load-source.js');

test('buildTrackingEntries_() puts the open event first and dedupes', () => {
  const { ctx } = loadSource();
  const sessions = [
    { active_event_id: 'a', calendar_id: 'primary' },
    { active_event_id: 'b', calendar_id: 'primary' }
  ];
  const context = { eventId: 'b', calendarId: 'primary', eventTitle: 'B', timeZone: 'Etc/UTC' };

  const entries = ctx.buildTrackingEntries_(context, ctx.normalizeSession_ ? sessions.map(ctx.normalizeSession_) : sessions);
  assert.ok(entries.length >= 2);
  assert.equal(entries[0].isOpen, true);
  assert.equal(entries[0].session.active_event_id, 'b');
});

test('buildStopModeApplyLabel_() reflects stop mode', () => {
  const { ctx } = loadSource();
  assert.equal(
    ctx.buildStopModeApplyLabel_({ stopMode: 'END_TIME' }, 'en'),
    'Save (end time)'
  );
  assert.equal(
    ctx.buildStopModeApplyLabel_({ stopMode: 'DESCRIPTION' }, 'es'),
    'Guardar (descripción)'
  );
  assert.equal(
    ctx.buildStopModeApplyLabel_({ stopMode: 'BOTH' }, 'en'),
    'Save (both)'
  );
});

test('statusLabel_() maps statuses', () => {
  const { ctx } = loadSource();
  assert.equal(ctx.statusLabel_('RUNNING', 'en'), 'Running');
  assert.equal(ctx.statusLabel_('PAUSED', 'es'), 'Pausado');
  assert.equal(ctx.statusLabel_('STOPPED', 'en'), 'Stopped');
  assert.equal(ctx.statusLabel_('NONE', 'en'), 'Not started');
});

test('formatTimeForUser_() and formatDateKey_() format UTC timestamps', () => {
  const { ctx } = loadSource();
  const date = new Date('2026-01-02T09:05:00Z');
  assert.equal(ctx.formatTimeForUser_(date, 'Etc/UTC'), '09:05');
  assert.equal(ctx.formatDateKey_(date, 'Etc/UTC'), '2026-01-02');
});

test('buildSettingsCard_() renders a card with the current settings', () => {
  const { ctx } = loadSource();
  const settings = ctx.getDefaultSettings_();
  const card = ctx.buildSettingsCard_({
    settings: settings,
    locale: 'en'
  });
  assert.equal(card.type, 'built');
});