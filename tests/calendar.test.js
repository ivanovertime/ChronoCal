'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/load-source.js');

function toHost(value) {
  return JSON.parse(JSON.stringify(value));
}

test('buildEventIdCandidates_() builds raw, normalized, and domain variants', () => {
  const { ctx } = loadSource();
  const candidates = ctx.buildEventIdCandidates_('abc123');
  assert.deepEqual(toHost(candidates), ['abc123', 'abc123@google.com']);

  const underscored = ctx.buildEventIdCandidates_('_abc123');
  assert.deepEqual(toHost(underscored), ['_abc123', 'abc123', '_abc123@google.com', 'abc123@google.com']);

  const withDomain = ctx.buildEventIdCandidates_('abc@example.com');
  assert.deepEqual(toHost(withDomain), ['abc@example.com']);
});

test('parseRecurringInstanceKey_() extracts base ID and start time', () => {
  const { ctx } = loadSource();
  const parsed = ctx.parseRecurringInstanceKey_('baseEvent_20260101T120000Z');
  assert.ok(parsed);
  assert.equal(parsed.baseId, 'baseEvent');
  assert.equal(parsed.startMs, Date.parse('2026-01-01T12:00:00Z'));
});

test('parseRecurringInstanceKey_() returns null for non-instance IDs', () => {
  const { ctx } = loadSource();
  assert.equal(ctx.parseRecurringInstanceKey_('plainEvent'), null);
  assert.equal(ctx.parseRecurringInstanceKey_('event_20260101T120000X'), null);
  assert.equal(ctx.parseRecurringInstanceKey_(''), null);
});

test('uniqueValues_() dedupes and drops empty strings', () => {
  const { ctx } = loadSource();
  assert.deepEqual(toHost(ctx.uniqueValues_(['a', 'a', '', 'b', 'a'])), ['a', 'b']);
});