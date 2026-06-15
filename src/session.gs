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

function getEventContext_(e) {
  var parameters = parseCardParameters_(e);
  var eventContext = e && e.calendar ? e.calendar : {};

  return {
    eventId: parameters.eventId || eventContext.eventId || '',
    calendarId: parameters.calendarId || eventContext.calendarId || 'primary',
    eventTitle: parameters.eventTitle || eventContext.title || 'Evento sin título',
    timeZone: parameters.timeZone || eventContext.timeZone || Session.getScriptTimeZone()
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

function isSameEvent_(session, context) {
  if (!session || !context) {
    return false;
  }

  return session.active_event_id === context.eventId && session.calendar_id === context.calendarId;
}
