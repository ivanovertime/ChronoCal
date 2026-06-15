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

function getActiveSession_() {
  return getStoredJson_(CHRONOCAL_CONFIG.sessionPropertyKey);
}

function saveActiveSession_(session) {
  setStoredJson_(CHRONOCAL_CONFIG.sessionPropertyKey, session);
}

function clearActiveSession_() {
  deleteStoredValue_(CHRONOCAL_CONFIG.sessionPropertyKey);
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
  return getStoredJson_(CHRONOCAL_CONFIG.settingsPropertyKey) || getDefaultSettings_();
}

function saveSettings_(settings) {
  setStoredJson_(CHRONOCAL_CONFIG.settingsPropertyKey, settings);
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

function getEventContext_(e) {
  var parameters = parseCardParameters_(e);
  var eventContext = e && e.calendar ? e.calendar : {};
  var nestedEvent = eventContext.event || {};
  var hostData = e && e.commonEventObject ? e.commonEventObject.hostAppData || {} : {};
  var hostEvent = hostData.event || {};

  return {
    eventId: firstNonEmpty_([
      parameters.eventId,
      parameters.calendarEventId,
      parameters.event_id,
      parameters.id,
      eventContext.eventId,
      eventContext.calendarEventId,
      eventContext.event_id,
      eventContext.id,
      nestedEvent.eventId,
      nestedEvent.calendarEventId,
      nestedEvent.event_id,
      nestedEvent.id,
      hostData.eventId,
      hostData.calendarEventId,
      hostEvent.eventId,
      hostEvent.calendarEventId,
      hostEvent.id
    ], ''),
    calendarId: firstNonEmpty_([
      parameters.calendarId,
      parameters.calendar_id,
      eventContext.calendarId,
      nestedEvent.calendarId,
      hostData.calendarId,
      hostEvent.calendarId
    ], 'primary'),
    eventTitle: firstNonEmpty_([
      parameters.eventTitle,
      parameters.title,
      parameters.summary,
      eventContext.eventTitle,
      eventContext.title,
      eventContext.summary,
      nestedEvent.eventTitle,
      nestedEvent.title,
      nestedEvent.summary,
      hostData.title,
      hostData.summary,
      hostEvent.title,
      hostEvent.summary
    ], 'Evento sin título'),
    timeZone: firstNonEmpty_([
      parameters.timeZone,
      eventContext.timeZone,
      nestedEvent.timeZone,
      hostData.timeZone,
      hostEvent.timeZone
    ], Session.getScriptTimeZone())
  };
}

function buildEventContextFromSession_(session) {
  if (!session) {
    return null;
  }

  return {
    eventId: session.active_event_id || '',
    calendarId: session.calendar_id || 'primary',
    eventTitle: session.event_title || 'Evento sin título',
    timeZone: session.timeZone || Session.getScriptTimeZone()
  };
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
