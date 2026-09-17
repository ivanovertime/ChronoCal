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

test('buildEntryActions_() wires appropriate buttons for RUNNING status', () => {
  const { ctx } = loadSource();
  const buttons = ctx.buildEntryActions_('RUNNING', { eventId: 'e1', calendarId: 'primary' }, ctx.getDefaultSettings_(), 'en');
  assert.equal(buttons.__buttons.length, 2);
  assert.equal(buttons.__buttons[0].__text, 'Pause');
  assert.equal(buttons.__buttons[0].__onClickAction.__functionName, 'onPauseTracking');
  assert.equal(buttons.__buttons[1].__text, 'Stop');
  assert.equal(buttons.__buttons[1].__onClickAction.__functionName, 'onStopTracking');
});

test('buildEntryActions_() wires appropriate buttons for PAUSED status', () => {
  const { ctx } = loadSource();
  const buttons = ctx.buildEntryActions_('PAUSED', { eventId: 'e1', calendarId: 'primary' }, ctx.getDefaultSettings_(), 'es');
  assert.equal(buttons.__buttons.length, 3);
  assert.equal(buttons.__buttons[0].__text, 'Reanudar');
  assert.equal(buttons.__buttons[0].__onClickAction.__functionName, 'onResumeTracking');
  assert.equal(buttons.__buttons[1].__text, 'Detener');
  assert.equal(buttons.__buttons[1].__onClickAction.__functionName, 'onStopTracking');
  assert.equal(buttons.__buttons[2].__text, 'Descartar');
  assert.equal(buttons.__buttons[2].__onClickAction.__functionName, 'onDiscardSession');
});

test('buildEntryActions_() wires Save, Export, and Discard for STOPPED when sheets export is enabled', () => {
  const { ctx } = loadSource();
  const settings = Object.assign(ctx.getDefaultSettings_(), { sheetsExportEnabled: true });
  const buttons = ctx.buildEntryActions_('STOPPED', { eventId: 'e1', calendarId: 'primary' }, settings, 'en');
  assert.equal(buttons.__buttons.length, 3);
  assert.equal(buttons.__buttons[0].__text, 'Save (description)');
  assert.equal(buttons.__buttons[0].__onClickAction.__functionName, 'onSaveSession');
  assert.equal(buttons.__buttons[1].__text, 'Export');
  assert.equal(buttons.__buttons[1].__onClickAction.__functionName, 'onExportSessionToSheets');
  assert.equal(buttons.__buttons[2].__text, 'Discard');
  assert.equal(buttons.__buttons[2].__onClickAction.__functionName, 'onDiscardSession');
});

test('buildEntryActions_() wires only Save and Discard for STOPPED when sheets export is disabled', () => {
  const { ctx } = loadSource();
  const settings = Object.assign(ctx.getDefaultSettings_(), { sheetsExportEnabled: false });
  const buttons = ctx.buildEntryActions_('STOPPED', { eventId: 'e1', calendarId: 'primary' }, settings, 'en');
  assert.equal(buttons.__buttons.length, 2);
  assert.equal(buttons.__buttons[0].__text, 'Save (description)');
  assert.equal(buttons.__buttons[0].__onClickAction.__functionName, 'onSaveSession');
  assert.equal(buttons.__buttons[1].__text, 'Discard');
  assert.equal(buttons.__buttons[1].__onClickAction.__functionName, 'onDiscardSession');
});

test('buildEntryActions_() wires Start button for unstarted events', () => {
  const { ctx } = loadSource();
  const buttons = ctx.buildEntryActions_('NONE', { eventId: 'e1', calendarId: 'primary' }, ctx.getDefaultSettings_(), 'en');
  assert.equal(buttons.__buttons.length, 1);
  assert.equal(buttons.__buttons[0].__text, 'Start');
  assert.equal(buttons.__buttons[0].__onClickAction.__functionName, 'onStartTracking');
  assert.equal(buttons.__buttons[0].__buttonStyle, 'FILLED');
});

test('buildEntryActions_() assigns FILLED style to primary actions across states', () => {
  const { ctx } = loadSource();
  const settings = Object.assign(ctx.getDefaultSettings_(), { sheetsExportEnabled: true });
  const context = { eventId: 'e1', calendarId: 'primary' };

  // RUNNING: Stop is primary (FILLED), Pause is secondary
  const running = ctx.buildEntryActions_('RUNNING', context, settings, 'en');
  assert.equal(running.__buttons[0].__buttonStyle, undefined);
  assert.equal(running.__buttons[1].__buttonStyle, 'FILLED');

  // PAUSED: Resume is primary (FILLED), Stop & Discard are secondary
  const paused = ctx.buildEntryActions_('PAUSED', context, settings, 'en');
  assert.equal(paused.__buttons[0].__buttonStyle, 'FILLED');
  assert.equal(paused.__buttons[1].__buttonStyle, undefined);
  assert.equal(paused.__buttons[2].__buttonStyle, undefined);

  // STOPPED: Save is primary (FILLED), Export & Discard are secondary
  const stopped = ctx.buildEntryActions_('STOPPED', context, settings, 'en');
  assert.equal(stopped.__buttons[0].__buttonStyle, 'FILLED');
  assert.equal(stopped.__buttons[1].__buttonStyle, undefined);
  assert.equal(stopped.__buttons[2].__buttonStyle, undefined);
});

test('buildBaseCard_() renders onboarding section when entries are empty', () => {
  const { ctx } = loadSource();
  const card = ctx.buildBaseCard_({
    eventContext: null,
    sessions: [],
    locale: 'es'
  });
  assert.equal(card.type, 'built');
  assert.ok(card.__sections && card.__sections.length >= 2);
  const onboardingSection = card.__sections[1];
  assert.equal(onboardingSection.__header, 'Cómo usar ChronoCal');
  assert.equal(onboardingSection.__widgets.length, 4);
});

test('buildBaseCard_() renders tracking entry section when event is present', () => {
  const { ctx } = loadSource();
  const card = ctx.buildBaseCard_({
    eventContext: { eventId: 'evt-1', eventTitle: 'Planning', calendarId: 'primary' },
    sessions: [],
    locale: 'en'
  });
  assert.equal(card.type, 'built');
  assert.ok(card.__sections && card.__sections.length >= 2);
  const entrySection = card.__sections[1];
  assert.ok(entrySection.__widgets.length >= 2);
});

test('buildSettingsCard_() includes about section with version', () => {
  const { ctx } = loadSource();
  const card = ctx.buildSettingsCard_({
    settings: ctx.getDefaultSettings_(),
    locale: 'en'
  });
  assert.equal(card.type, 'built');
  const aboutSection = card.__sections.find((s) => s.__header === 'About ChronoCal');
  assert.ok(aboutSection);
  assert.ok(aboutSection.__widgets.length >= 2);
  assert.equal(aboutSection.__widgets[0].__text, 'ChronoCal v1.0.0');
});

test('buildFixedFooter_() assigns FILLED style to primary buttons', () => {
  const { ctx } = loadSource();
  const runningSessions = [{ status: 'RUNNING', active_event_id: 'e1', started_at_ms: Date.now(), elapsed_ms: 0 }];
  const footerRunning = ctx.buildFixedFooter_(runningSessions, 'en');
  assert.equal(footerRunning.__primaryButton.__buttonStyle, undefined);
  assert.equal(footerRunning.__secondaryButton.__buttonStyle, 'FILLED');

  const stoppedSessions = [{ status: 'STOPPED', active_event_id: 'e1', elapsed_ms: 1000 }];
  const footerStopped = ctx.buildFixedFooter_(stoppedSessions, 'en');
  assert.equal(footerStopped.__primaryButton.__buttonStyle, 'FILLED');
});