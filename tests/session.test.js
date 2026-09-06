'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/load-source.js');

const DAY_MS = 24 * 60 * 60 * 1000;

function baseSession(overrides) {
  return Object.assign({
    active_event_id: 'event-1',
    calendar_id: 'primary',
    event_title: 'Standup',
    time_zone: 'Etc/UTC',
    started_at_ms: 1000,
    started_at_iso: new Date(1000).toISOString(),
    elapsed_ms: 0,
    status: 'RUNNING'
  }, overrides || {});
}

test('formatDuration_() formats HH:MM:SS', () => {
  const { ctx } = loadSource();
  assert.equal(ctx.formatDuration_(0), '00:00:00');
  assert.equal(ctx.formatDuration_(3661000), '01:01:01');
  assert.equal(ctx.formatDuration_(-5000), '00:00:00');
});

test('calculateSessionDurationMs_() uses elapsed for paused/stopped sessions', () => {
  const { ctx, setNow } = loadSource();
  setNow(1000);
  const paused = ctx.pauseSessionInPlace_(baseSession(), 1000);
  assert.equal(ctx.calculateSessionDurationMs_(paused), 0);

  const stopped = baseSession({ status: 'STOPPED', elapsed_ms: 60000 });
  assert.equal(ctx.calculateSessionDurationMs_(stopped), 60000);
});

test('calculateSessionDurationMs_() adds elapsed since start for running sessions', async () => {
  const { ctx, setNow } = loadSource();
  setNow(100000);
  const running = baseSession({ started_at_ms: 50000 });
  assert.ok(ctx.calculateSessionDurationMs_(running) >= 50000);
});

test('pause/resume/stop transitions keep elapsed time', () => {
  const { ctx, setNow } = loadSource();
  setNow(5000);
  const session = baseSession({ started_at_ms: 1000 });

  ctx.pauseSessionInPlace_(session, 5000);
  assert.equal(session.status, 'PAUSED');
  assert.equal(session.elapsed_ms, 4000);

  setNow(10000);
  ctx.resumeSessionInPlace_(session, 10000);
  assert.equal(session.status, 'RUNNING');
  assert.equal(session.started_at_ms, 10000);

  setNow(15000);
  ctx.stopSessionInPlace_(session, 15000);
  assert.equal(session.status, 'STOPPED');
  assert.equal(session.elapsed_ms, 9000);
  assert.equal(session.stopped_at_iso, new Date(15000).toISOString());
});

test('normalizeSession_() fills defaults', () => {
  const { ctx } = loadSource();
  const normalized = ctx.normalizeSession_({
    active_event_id: 'evt',
    calendar_id: 'primary'
  });
  assert.equal(normalized.event_title, 'Evento sin título');
  assert.equal(normalized.status, 'RUNNING');
  assert.equal(normalized.time_zone, 'Etc/UTC');
});

test('capSessions_() keeps active sessions and newest stopped sessions', () => {
  const { ctx } = loadSource();
  const sessions = [];
  for (let i = 0; i < 10; i++) {
    sessions.push(baseSession({
      active_event_id: 'stopped-' + i,
      status: 'STOPPED',
      stopped_at_iso: new Date(1000 + i * 1000).toISOString(),
      elapsed_ms: 1000
    }));
  }
  sessions.push(baseSession({ active_event_id: 'running-1' }));
  sessions.push(baseSession({ active_event_id: 'paused-1', status: 'PAUSED' }));

  const capped = ctx.capSessions_(sessions, 5);
  assert.equal(capped.length, 5);
  assert.equal(capped[0].active_event_id, 'running-1');
  assert.equal(capped[1].active_event_id, 'paused-1');
  assert.equal(capped[2].active_event_id, 'stopped-9');
  assert.equal(capped[4].active_event_id, 'stopped-7');
});

test('capEventMetaCache_() evicts oldest entries by updatedAt', () => {
  const { ctx } = loadSource();
  const cache = {};
  for (let i = 0; i < 5; i++) {
    cache['cal::' + i] = {
      eventTitle: 'Title ' + i,
      updatedAt: new Date(1000 + i * 1000).toISOString()
    };
  }
  const capped = ctx.capEventMetaCache_(cache, 3);
  assert.equal(Object.keys(capped).length, 3);
  assert.ok(!('cal::0' in capped));
  assert.ok('cal::4' in capped);
});

test('getSessions_() migrates the legacy single-session key', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_ACTIVE_SESSION', JSON.stringify({
    active_event_id: 'legacy-1',
    calendar_id: 'primary'
  }));

  const sessions = ctx.getSessions_();
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].active_event_id, 'legacy-1');
  assert.equal(sessions[0].status, 'RUNNING');
});

test('getSessions_() migrates the legacy last-result no longer double-counts', () => {
  const { ctx, store } = loadSource();
  store.setProperty('CHRONOCAL_LAST_RESULT', JSON.stringify({
    event_id: 'old-ev',
    calendar_id: 'primary',
    duration_ms: 60000,
    stopped_at_iso: new Date(2000).toISOString()
  }));

  const sessions = ctx.getSessions_();
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].status, 'STOPPED');
  assert.equal(sessions[0].elapsed_ms, 60000);
  assert.equal(store.getProperty('CHRONOCAL_LAST_RESULT'), null);
});

test('getFormInputValue_() reads input.value, stringInputs, and value shapes', () => {
  const { ctx } = loadSource();
  const e = {
    commonEventObject: {
      formInputs: {
        a: { input: { value: 'hello' } },
        b: { stringInputs: { value: 'dropdown' } },
        c: { stringInputs: { values: ['selection'] } },
        d: { value: 'world' },
        e: { input: { value: '' } }
      }
    }
  };
  assert.equal(ctx.getFormInputValue_(e, 'a'), 'hello');
  assert.equal(ctx.getFormInputValue_(e, 'b'), 'dropdown');
  assert.equal(ctx.getFormInputValue_(e, 'c'), 'selection');
  assert.equal(ctx.getFormInputValue_(e, 'd'), 'world');
  assert.equal(ctx.getFormInputValue_(e, 'e'), '');
  assert.equal(ctx.getFormInputValue_(e, 'missing'), '');
  assert.equal(ctx.getFormInputValue_({}, 'a'), '');
});

test('parseSpreadsheetReference_() extracts IDs from URLs', () => {
  const { ctx } = loadSource();
  const longId = '1AbCdefG1234567890XYZabcDEF456789XYZ';
  assert.equal(
    ctx.parseSpreadsheetReference_('https://docs.google.com/spreadsheets/d/' + longId + '/edit#gid=0'),
    longId
  );
  assert.equal(ctx.parseSpreadsheetReference_(longId), longId);
  assert.equal(ctx.parseSpreadsheetReference_(''), null);
  assert.equal(ctx.parseSpreadsheetReference_('   '), null);
  assert.equal(ctx.parseSpreadsheetReference_('not a valid id'), '');
});