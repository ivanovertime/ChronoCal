function getUserProperties_() {
  return PropertiesService.getUserProperties();
}

function getStoredJson_(key) {
  var rawValue = getUserProperties_().getProperty(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return null;
  }
}

function setStoredJson_(key, value) {
  getUserProperties_().setProperty(key, JSON.stringify(value));
}

function deleteStoredValue_(key) {
  getUserProperties_().deleteProperty(key);
}

function normalizeSessionStatus_(status) {
  if (status === 'PAUSED' || status === 'STOPPED') {
    return status;
  }

  return 'RUNNING';
}

function normalizeSession_(session) {
  if (!session || !session.active_event_id || !session.calendar_id) {
    return null;
  }

  return {
    active_event_id: session.active_event_id,
    calendar_id: session.calendar_id,
    event_title: session.event_title || 'Evento sin título',
    time_zone: session.time_zone || session.timeZone || Session.getScriptTimeZone(),
    started_at_ms: Number(session.started_at_ms || Date.now()),
    started_at_iso: session.started_at_iso || new Date(Number(session.started_at_ms || Date.now())).toISOString(),
    elapsed_ms: Number(session.elapsed_ms || 0),
    status: normalizeSessionStatus_(session.status),
    stopped_at_iso: session.stopped_at_iso || ''
  };
}

function getSessions_() {
  var rawSessions = getStoredJson_(CHRONOCAL_CONFIG.sessionsPropertyKey);
  var sessions = [];

  if (rawSessions && Array.isArray(rawSessions)) {
    sessions = rawSessions
      .map(normalizeSession_)
      .filter(function(session) {
        return Boolean(session);
      });
  }

  // Migration path for older installs that used a single active session key.
  if (!sessions.length) {
    var legacySession = normalizeSession_(getStoredJson_(CHRONOCAL_CONFIG.sessionPropertyKey));
    if (legacySession) {
      sessions = [legacySession];
      saveSessions_(sessions);
    }
  }

  // Migration path for the older single pending-result store: fold it into the
  // sessions list as a STOPPED entry so every event lives in one collection.
  var legacyResult = getStoredJson_(CHRONOCAL_CONFIG.lastResultPropertyKey);
  if (legacyResult && legacyResult.event_id) {
    var alreadyTracked = sessions.some(function(session) {
      return session.active_event_id === legacyResult.event_id && session.calendar_id === (legacyResult.calendar_id || 'primary');
    });

    if (!alreadyTracked) {
      var stoppedAtMs = Date.parse(legacyResult.stopped_at_iso || '') || Date.now();
      sessions.push(normalizeSession_({
        active_event_id: legacyResult.event_id,
        calendar_id: legacyResult.calendar_id || 'primary',
        event_title: legacyResult.event_title,
        time_zone: legacyResult.time_zone,
        started_at_ms: stoppedAtMs,
        elapsed_ms: Number(legacyResult.duration_ms || 0),
        status: 'STOPPED',
        stopped_at_iso: legacyResult.stopped_at_iso || new Date(stoppedAtMs).toISOString()
      }));
    }

    deleteStoredValue_(CHRONOCAL_CONFIG.lastResultPropertyKey);
    saveSessions_(sessions);
  }

  return sessions;
}

function saveSessions_(sessions) {
  var normalized = (sessions || [])
    .map(normalizeSession_)
    .filter(function(session) {
      return Boolean(session);
    });

  setStoredJson_(CHRONOCAL_CONFIG.sessionsPropertyKey, normalized);

  // Keep legacy key in sync for compatibility with old cards/functions.
  if (normalized.length) {
    setStoredJson_(CHRONOCAL_CONFIG.sessionPropertyKey, normalized[0]);
  } else {
    deleteStoredValue_(CHRONOCAL_CONFIG.sessionPropertyKey);
  }
}

function clearSessions_() {
  deleteStoredValue_(CHRONOCAL_CONFIG.sessionsPropertyKey);
  deleteStoredValue_(CHRONOCAL_CONFIG.sessionPropertyKey);
}

function getActiveSession_() {
  var sessions = getSessions_();
  return getRunningSession_(sessions) || (sessions.length ? sessions[0] : null);
}

function saveActiveSession_(session) {
  saveSessions_([session]);
}

function clearActiveSession_() {
  clearSessions_();
}

function getLastResult_() {
  return getStoredJson_(CHRONOCAL_CONFIG.lastResultPropertyKey);
}

function saveLastResult_(result) {
  setStoredJson_(CHRONOCAL_CONFIG.lastResultPropertyKey, result);
}

function clearLastResult_() {
  deleteStoredValue_(CHRONOCAL_CONFIG.lastResultPropertyKey);
}

function getSettings_() {
  return normalizeSettings_(getStoredJson_(CHRONOCAL_CONFIG.settingsPropertyKey));
}

function saveSettings_(settings) {
  setStoredJson_(CHRONOCAL_CONFIG.settingsPropertyKey, normalizeSettings_(settings));
}

function formatDuration_(durationMs) {
  var totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  var hours = Math.floor(totalSeconds / 3600);
  var minutes = Math.floor((totalSeconds % 3600) / 60);
  var seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(function(part) {
      return String(part).padStart(2, '0');
    })
    .join(':');
}

function formatDateForUser_(dateValue, timeZone) {
  return Utilities.formatDate(dateValue, timeZone || Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function getEventMetaCache_() {
  return getStoredJson_(CHRONOCAL_CONFIG.eventMetaCachePropertyKey) || {};
}

function saveEventMetaCache_(cache) {
  setStoredJson_(CHRONOCAL_CONFIG.eventMetaCachePropertyKey, cache || {});
}

function rememberEventMeta_(context) {
  if (!context || !context.eventId || isUntitledEvent_(context.eventTitle)) {
    return;
  }

  var cache = getEventMetaCache_();
  cache[context.calendarId + '::' + context.eventId] = {
    eventTitle: context.eventTitle,
    timeZone: context.timeZone || Session.getScriptTimeZone(),
    updatedAt: new Date().toISOString()
  };
  saveEventMetaCache_(cache);
}

function getCachedEventMeta_(calendarId, eventId) {
  if (!eventId) {
    return null;
  }

  var cache = getEventMetaCache_();
  return cache[(calendarId || 'primary') + '::' + eventId] || null;
}

function parseCardParameters_(e) {
  if (!e) {
    return {};
  }

  if (e.commonEventObject && e.commonEventObject.parameters) {
    return e.commonEventObject.parameters;
  }

  if (e.parameters) {
    return e.parameters;
  }

  return {};
}

function firstNonEmpty_(values, fallback) {
  for (var i = 0; i < values.length; i++) {
    var value = values[i];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return fallback;
}

function getByPath_(source, path) {
  if (!source) {
    return undefined;
  }

  var steps = String(path || '').split('.');
  var cursor = source;
  for (var i = 0; i < steps.length; i++) {
    if (cursor === undefined || cursor === null || typeof cursor !== 'object' || !(steps[i] in cursor)) {
      return undefined;
    }
    cursor = cursor[steps[i]];
  }

  return cursor;
}

function pickByPaths_(source, paths) {
  var values = (paths || []).map(function(path) {
    return getByPath_(source, path);
  });

  return firstNonEmpty_(values, '');
}

function sanitizeEventId_(value) {
  var raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  // Calendar event IDs do not contain spaces or URL path separators.
  if (raw.indexOf(' ') !== -1 || raw.indexOf('/') !== -1) {
    return '';
  }

  return raw;
}

function getEventContext_(e) {
  var parameters = parseCardParameters_(e);
  var rawEventId = firstNonEmpty_([
    parameters.eventId,
    parameters.calendarEventId,
    parameters.event_id,
    parameters.id,
    pickByPaths_(e, [
      'calendar.eventId',
      'calendar.calendarEventId',
      'calendar.id',
      'calendar.event.eventId',
      'calendar.event.calendarEventId',
      'calendar.event.id',
      'commonEventObject.hostAppData.eventId',
      'commonEventObject.hostAppData.calendarEventId',
      'commonEventObject.hostAppData.id',
      'commonEventObject.hostAppData.event.eventId',
      'commonEventObject.hostAppData.event.calendarEventId',
      'commonEventObject.hostAppData.event.id',
      'commonEventObject.platformSpecificData.eventId',
      'commonEventObject.platformSpecificData.calendarEventId',
      'commonEventObject.platformSpecificData.id',
      'eventId',
      'calendarEventId'
    ])
  ], '');
  var eventId = sanitizeEventId_(rawEventId);

  var calendarId = firstNonEmpty_([
    parameters.calendarId,
    parameters.calendar_id,
    pickByPaths_(e, [
      'calendar.calendarId',
      'calendar.event.calendarId',
      'commonEventObject.hostAppData.calendarId',
      'commonEventObject.hostAppData.event.calendarId',
      'commonEventObject.platformSpecificData.calendarId',
      'calendarId'
    ])
  ], 'primary');

  var eventTitle = firstNonEmpty_([
    parameters.eventTitle,
    parameters.summary,
    pickByPaths_(e, [
      'calendar.eventTitle',
      'calendar.title',
      'calendar.summary',
      'calendar.event.eventTitle',
      'calendar.event.title',
      'calendar.event.summary',
      'commonEventObject.hostAppData.eventTitle',
      'commonEventObject.hostAppData.title',
      'commonEventObject.hostAppData.summary',
      'commonEventObject.hostAppData.event.eventTitle',
      'commonEventObject.hostAppData.event.title',
      'commonEventObject.hostAppData.event.summary',
      'commonEventObject.platformSpecificData.eventTitle',
      'commonEventObject.platformSpecificData.title',
      'commonEventObject.platformSpecificData.summary'
    ])
  ], '');

  var timeZone = firstNonEmpty_([
    parameters.timeZone,
    pickByPaths_(e, [
      'calendar.timeZone',
      'calendar.event.timeZone',
      'commonEventObject.hostAppData.timeZone',
      'commonEventObject.hostAppData.event.timeZone',
      'commonEventObject.platformSpecificData.timeZone',
      'timeZone'
    ])
  ], Session.getScriptTimeZone());

  var cachedMeta = getCachedEventMeta_(calendarId, eventId);
  var context = {
    eventId: eventId,
    calendarId: calendarId,
    eventTitle: firstNonEmpty_([eventTitle, cachedMeta && cachedMeta.eventTitle], 'Evento sin título'),
    timeZone: firstNonEmpty_([timeZone, cachedMeta && cachedMeta.timeZone], Session.getScriptTimeZone())
  };

  context = enrichEventContextFromCalendar_(context);
  rememberEventMeta_(context);
  return context;
}

function buildEventContextFromSession_(session) {
  if (!session) {
    return null;
  }

  return {
    eventId: session.active_event_id || '',
    calendarId: session.calendar_id || 'primary',
    eventTitle: session.event_title || 'Evento sin título',
    timeZone: session.time_zone || session.timeZone || Session.getScriptTimeZone()
  };
}

function getSessionForEvent_(sessions, context) {
  if (!context || !context.eventId) {
    return null;
  }

  var list = sessions || [];
  for (var i = 0; i < list.length; i++) {
    if (isSameEvent_(list[i], context)) {
      return list[i];
    }
  }

  return null;
}

function removeSessionByEvent_(sessions, context) {
  var list = sessions || [];
  return list.filter(function(session) {
    return !isSameEvent_(session, context);
  });
}

function getRunningSession_(sessions) {
  var list = sessions || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].status === 'RUNNING') {
      return list[i];
    }
  }

  return null;
}

function calculateSessionDurationMs_(session) {
  if (!session) {
    return 0;
  }

  var elapsedMs = Number(session.elapsed_ms || 0);
  if (session.status === 'RUNNING') {
    elapsedMs += Math.max(0, Date.now() - Number(session.started_at_ms || Date.now()));
  }

  return Math.max(0, elapsedMs);
}

function pauseSessionInPlace_(session, nowMs) {
  if (!session || session.status !== 'RUNNING') {
    return;
  }

  var currentMs = Number(nowMs || Date.now());
  session.elapsed_ms = Number(session.elapsed_ms || 0) + Math.max(0, currentMs - Number(session.started_at_ms || currentMs));
  session.started_at_ms = currentMs;
  session.status = 'PAUSED';
}

function resumeSessionInPlace_(session, nowMs) {
  if (!session) {
    return;
  }

  session.started_at_ms = Number(nowMs || Date.now());
  session.status = 'RUNNING';
}

function stopSessionInPlace_(session, nowMs) {
  if (!session) {
    return;
  }

  var currentMs = Number(nowMs || Date.now());
  if (session.status === 'RUNNING') {
    session.elapsed_ms = Number(session.elapsed_ms || 0) + Math.max(0, currentMs - Number(session.started_at_ms || currentMs));
  }
  session.started_at_ms = currentMs;
  session.status = 'STOPPED';
  session.stopped_at_iso = new Date(currentMs).toISOString();
}

function pauseAllSessions_(sessions, nowMs) {
  var list = sessions || [];
  var count = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].status === 'RUNNING') {
      pauseSessionInPlace_(list[i], nowMs);
      count++;
    }
  }
  return count;
}

function stopAllSessions_(sessions, nowMs) {
  var list = sessions || [];
  var count = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].status === 'RUNNING' || list[i].status === 'PAUSED') {
      stopSessionInPlace_(list[i], nowMs);
      count++;
    }
  }
  return count;
}

function getStoppedSessions_(sessions) {
  return (sessions || []).filter(function(session) {
    return session.status === 'STOPPED';
  });
}

function buildEventContextFromResult_(result) {
  if (!result) {
    return null;
  }

  return {
    eventId: result.event_id || '',
    calendarId: result.calendar_id || 'primary',
    eventTitle: result.event_title || 'Evento sin título',
    timeZone: result.time_zone || Session.getScriptTimeZone()
  };
}

function isUntitledEvent_(title) {
  return !title || title === 'Evento sin título';
}

function isSameEvent_(session, context) {
  if (!session || !context) {
    return false;
  }

  return session.active_event_id === context.eventId && session.calendar_id === context.calendarId;
}
