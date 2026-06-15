function findTrackedEvent_(context) {
  var calendar = CalendarApp.getCalendarById(context.calendarId);

  if (!calendar) {
    throw new Error('No se encontró el calendario activo.');
  }

  var event = calendar.getEventById(context.eventId);

  if (!event) {
    throw new Error('No se encontró el evento activo o ya no está disponible.');
  }

  return event;
}

function buildDurationLine_(durationMs, stoppedAt, timeZone) {
  return CHRONOCAL_CONFIG.descriptionTag + ' ' + formatDuration_(durationMs) + ' (Fecha: ' + formatDateForUser_(stoppedAt, timeZone) + ')';
}

function updateEventDescription_(context, durationMs) {
  var event = findTrackedEvent_(context);
  var originalDescription = event.getDescription() || '';
  var stopAt = new Date();
  var durationLine = buildDurationLine_(durationMs, stopAt, context.timeZone);
  var pattern = new RegExp('^' + escapeRegex_(CHRONOCAL_CONFIG.descriptionTag) + '.*$', 'm');
  var nextDescription = originalDescription;

  if (pattern.test(originalDescription)) {
    nextDescription = originalDescription.replace(pattern, durationLine);
  } else if (originalDescription) {
    nextDescription = originalDescription + '\n\n' + durationLine;
  } else {
    nextDescription = durationLine;
  }

  event.setDescription(nextDescription);

  return {
    eventTitle: event.getTitle(),
    durationLine: durationLine,
    stoppedAt: stopAt.toISOString()
  };
}

function escapeRegex_(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
