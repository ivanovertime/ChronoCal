function pushDiagnostic_(diagnostics, message) {
  if (!diagnostics || !message) {
    return;
  }

  if (diagnostics.indexOf(message) === -1) {
    diagnostics.push(message);
  }
}

function tryGetEventById_(calendarId, eventId, diagnostics) {
  if (!calendarId || !eventId) {
    return null;
  }

  try {
    return Calendar.Events.get(calendarId, eventId);
  } catch (error) {
    pushDiagnostic_(diagnostics, 'Events.get(' + calendarId + ', ' + eventId + '): ' + (error && error.message ? error.message : String(error)));
    return null;
  }
}

function buildEventIdCandidates_(eventId) {
  var raw = String(eventId || '');
  var normalized = raw.charAt(0) === '_' ? raw.substring(1) : raw;
  var candidates = [raw, normalized];
  var withDomain = [];

  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
    if (!candidate) {
      continue;
    }
    if (candidate.indexOf('@') === -1) {
      withDomain.push(candidate + '@google.com');
    }
  }

  return uniqueValues_(candidates.concat(withDomain));
}

function parseRecurringInstanceKey_(eventId) {
  var raw = String(eventId || '');
  var normalized = raw.charAt(0) === '_' ? raw.substring(1) : raw;
  var match = normalized.match(/^(.+)_([0-9]{8}T[0-9]{6}Z)$/i);

  if (!match) {
    return null;
  }

  var iso = match[2].replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/i, '$1-$2-$3T$4:$5:$6Z');
  var startMs = Date.parse(iso);
  if (isNaN(startMs)) {
    return null;
  }

  return {
    baseId: match[1],
    startMs: startMs,
    raw: raw,
    normalized: normalized
  };
}

function chooseClosestTimedEvent_(items, targetMs) {
  var list = items || [];
  if (!list.length) {
    return null;
  }

  var best = null;
  var bestDistance = Number.MAX_SAFE_INTEGER;

  for (var i = 0; i < list.length; i++) {
    var candidate = list[i];
    var dateTime = candidate && candidate.start ? candidate.start.dateTime : '';
    if (!dateTime) {
      continue;
    }

    var candidateMs = Date.parse(dateTime);
    if (isNaN(candidateMs)) {
      continue;
    }

    var distance = Math.abs(candidateMs - targetMs);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return best;
}

function buildRecurringBaseCandidates_(baseId) {
  var base = String(baseId || '');
  var normalized = base.charAt(0) === '_' ? base.substring(1) : base;
  var candidates = [base, normalized];

  if (base && base.indexOf('@') === -1) {
    candidates.push(base + '@google.com');
  }
  if (normalized && normalized.indexOf('@') === -1) {
    candidates.push(normalized + '@google.com');
  }

  if (normalized) {
    candidates.push('_' + normalized);
  }

  return uniqueValues_(candidates);
}

function tryFindEventByInstancesEndpoint_(calendarId, parsed, diagnostics) {
  var recurringCandidates = buildRecurringBaseCandidates_(parsed.baseId);
  var timeMin = new Date(parsed.startMs - (24 * 60 * 60 * 1000)).toISOString();
  var timeMax = new Date(parsed.startMs + (24 * 60 * 60 * 1000)).toISOString();

  for (var i = 0; i < recurringCandidates.length; i++) {
    try {
      var instances = Calendar.Events.instances(calendarId, recurringCandidates[i], {
        timeMin: timeMin,
        timeMax: timeMax,
        maxResults: 100
      });
      var items = instances && instances.items ? instances.items : [];
      if (!items.length) {
        continue;
      }

      var closest = chooseClosestTimedEvent_(items, parsed.startMs);
      if (closest) {
        return closest;
      }

      return items[0];
    } catch (error) {
      pushDiagnostic_(diagnostics, 'Events.instances(' + calendarId + ', ' + recurringCandidates[i] + '): ' + (error && error.message ? error.message : String(error)));
    }
  }

  return null;
}

function tryFindEventByRecurringInstanceKey_(calendarId, eventId, diagnostics) {
  if (!calendarId || !eventId) {
    return null;
  }

  var parsed = parseRecurringInstanceKey_(eventId);
  if (!parsed) {
    return null;
  }

  var instanceEndpointMatch = tryFindEventByInstancesEndpoint_(calendarId, parsed, diagnostics);
  if (instanceEndpointMatch) {
    return instanceEndpointMatch;
  }

  var timeMin = new Date(parsed.startMs - (24 * 60 * 60 * 1000)).toISOString();
  var timeMax = new Date(parsed.startMs + (24 * 60 * 60 * 1000)).toISOString();
  var iCalUidCandidates = buildEventIdCandidates_(parsed.baseId);

  try {
    var listResult = Calendar.Events.list(calendarId, {
      singleEvents: true,
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: 50
    });
    var items = listResult && listResult.items ? listResult.items : [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var itemId = String(item.id || '');
      var recurringEventId = String(item.recurringEventId || '');
      var iCalUid = String(item.iCalUID || '');

      if (itemId === parsed.raw || itemId === parsed.normalized) {
        return item;
      }

      if (recurringEventId === parsed.baseId || recurringEventId === '_' + parsed.baseId) {
        return item;
      }

      if (iCalUidCandidates.indexOf(iCalUid) !== -1) {
        return item;
      }
    }

    var closestCandidate = chooseClosestTimedEvent_(items, parsed.startMs);
    if (closestCandidate) {
      return closestCandidate;
    }

    if (items.length === 1) {
      return items[0];
    }
  } catch (error) {
    pushDiagnostic_(diagnostics, 'Events.list window(' + calendarId + '): ' + (error && error.message ? error.message : String(error)));
    return null;
  }

  return null;
}

function uniqueValues_(values) {
  var seen = {};
  var result = [];

  for (var i = 0; i < values.length; i++) {
    var value = String(values[i] || '');
    if (!value || seen[value]) {
      continue;
    }
    seen[value] = true;
    result.push(value);
  }

  return result;
}

function tryFindEventByIcalUid_(calendarId, iCalUid, diagnostics) {
  if (!calendarId || !iCalUid) {
    return null;
  }

  var uidCandidates = buildEventIdCandidates_(iCalUid);
  for (var i = 0; i < uidCandidates.length; i++) {
    try {
      var listResult = Calendar.Events.list(calendarId, {
        iCalUID: uidCandidates[i],
        maxResults: 1,
        singleEvents: true
      });
      if (listResult && listResult.items && listResult.items.length) {
        return listResult.items[0];
      }
    } catch (error) {
      pushDiagnostic_(diagnostics, 'Events.list iCalUID(' + calendarId + ', ' + uidCandidates[i] + '): ' + (error && error.message ? error.message : String(error)));
    }
  }

  return null;
}

function resolveCalendarEvent_(context, diagnostics) {
  var eventId = context && context.eventId ? String(context.eventId) : '';
  var calendarId = context && context.calendarId ? String(context.calendarId) : 'primary';
  var idCandidates = buildEventIdCandidates_(eventId);

  for (var i = 0; i < idCandidates.length; i++) {
    var eventById = tryGetEventById_(calendarId, idCandidates[i], diagnostics);
    if (eventById) {
      return {
        calendarId: calendarId,
        event: eventById
      };
    }
  }

  var eventByIcal = tryFindEventByIcalUid_(calendarId, eventId, diagnostics);
  if (eventByIcal) {
    return {
      calendarId: calendarId,
      event: eventByIcal
    };
  }

  var eventByInstanceKey = tryFindEventByRecurringInstanceKey_(calendarId, eventId, diagnostics);
  if (eventByInstanceKey) {
    return {
      calendarId: calendarId,
      event: eventByInstanceKey
    };
  }

  try {
    var calendarList = Calendar.CalendarList.list({
      maxResults: 250
    });
    var items = calendarList && calendarList.items ? calendarList.items : [];

    for (var j = 0; j < items.length; j++) {
      var candidateCalendarId = items[j].id;

      for (var k = 0; k < idCandidates.length; k++) {
        var crossCalendarEvent = tryGetEventById_(candidateCalendarId, idCandidates[k], diagnostics);
        if (crossCalendarEvent) {
          return {
            calendarId: candidateCalendarId,
            event: crossCalendarEvent
          };
        }
      }

      var crossCalendarByIcal = tryFindEventByIcalUid_(candidateCalendarId, eventId, diagnostics);
      if (crossCalendarByIcal) {
        return {
          calendarId: candidateCalendarId,
          event: crossCalendarByIcal
        };
      }

      var crossCalendarByInstanceKey = tryFindEventByRecurringInstanceKey_(candidateCalendarId, eventId, diagnostics);
      if (crossCalendarByInstanceKey) {
        return {
          calendarId: candidateCalendarId,
          event: crossCalendarByInstanceKey
        };
      }
    }
  } catch (error) {
    pushDiagnostic_(diagnostics, 'CalendarList.list: ' + (error && error.message ? error.message : String(error)));
    // If calendar list is unavailable, keep the default failure below.
  }

  if (diagnostics && !diagnostics.length) {
    diagnostics.push('No match found for provided event identifier candidates.');
  }

  return null;
}

function getCalendarEventResource_(context, locale) {
  var resolved = resolveCalendarEvent_(context);
  if (!resolved || !resolved.event) {
    throw new Error(t_('calendar.eventNotFound', null, locale || CHRONOCAL_CONFIG.defaultLocale));
  }

  return resolved;
}

function enrichEventContextFromCalendar_(context) {
  if (!context || !context.eventId) {
    return context;
  }

  try {
    var resolved = getCalendarEventResource_(context, CHRONOCAL_CONFIG.defaultLocale);
    var event = resolved.event;
    context.eventId = firstNonEmpty_([event.id, context.eventId], context.eventId);
    context.calendarId = firstNonEmpty_([resolved.calendarId, context.calendarId], context.calendarId);
    context.eventTitle = firstNonEmpty_([event.summary, context.eventTitle], t_('common.untitledEvent', null, CHRONOCAL_CONFIG.defaultLocale));
    context.timeZone = firstNonEmpty_([
      event.start && event.start.timeZone,
      event.end && event.end.timeZone,
      context.timeZone
    ], Session.getScriptTimeZone());
  } catch (error) {
    // Keep the context as-is when the API cannot enrich metadata.
  }

  return context;
}

function buildDurationLine_(durationMs, stoppedAt, timeZone, locale) {
  return getDurationTag_(locale) + ' ' + formatDuration_(durationMs) + ' (' + t_('duration.dateLabel', null, locale) + ': ' + formatDateForUser_(stoppedAt, timeZone, locale) + ')';
}

function updateEventDescription_(context, durationMs, locale) {
  var activeLocale = getSupportedLocale_(locale) || CHRONOCAL_CONFIG.defaultLocale;
  var resolved = getCalendarEventResource_(context, activeLocale);
  var event = resolved.event;
  var targetCalendarId = resolved.calendarId;
  var targetEventId = event.id;
  var originalDescription = event.description || '';
  var stopAt = new Date();
  var effectiveTimeZone = firstNonEmpty_([
    event.start && event.start.timeZone,
    event.end && event.end.timeZone,
    context.timeZone
  ], Session.getScriptTimeZone());
  var durationLine = buildDurationLine_(durationMs, stopAt, effectiveTimeZone, activeLocale);
  var tags = getDurationTagVariants_().map(function(tag) {
    return escapeRegex_(tag);
  });
  var pattern = new RegExp('^(' + tags.join('|') + ').*$', 'm');
  var nextDescription = originalDescription;

  if (pattern.test(originalDescription)) {
    nextDescription = originalDescription.replace(pattern, durationLine);
  } else if (originalDescription) {
    nextDescription = originalDescription + '\n\n' + durationLine;
  } else {
    nextDescription = durationLine;
  }

  Calendar.Events.patch({
    description: nextDescription
  }, targetCalendarId, targetEventId);

  return {
    eventTitle: firstNonEmpty_([event.summary, context.eventTitle], t_('common.untitledEvent', null, activeLocale)),
    durationLine: durationLine,
    stoppedAt: stopAt.toISOString()
  };
}

function updateEventEndTime_(context, durationMs, locale) {
  var activeLocale = getSupportedLocale_(locale) || CHRONOCAL_CONFIG.defaultLocale;
  var resolved = getCalendarEventResource_(context, activeLocale);
  var event = resolved.event;
  var targetCalendarId = resolved.calendarId;
  var targetEventId = event.id;

  var startDateTime = event.start && event.start.dateTime;
  if (!startDateTime) {
    throw new Error(t_('notify.endTimeNotApplicableAllDay', null, activeLocale));
  }

  var startMs = Date.parse(startDateTime);
  if (isNaN(startMs)) {
    throw new Error(t_('calendar.eventNotFound', null, activeLocale));
  }

  var effectiveTimeZone = firstNonEmpty_([
    event.start && event.start.timeZone,
    event.end && event.end.timeZone,
    context.timeZone
  ], Session.getScriptTimeZone());

  var newEndMs = startMs + Math.max(0, Number(durationMs || 0));
  var newEnd = new Date(newEndMs);

  Calendar.Events.patch({
    end: {
      dateTime: newEnd.toISOString(),
      timeZone: effectiveTimeZone
    }
  }, targetCalendarId, targetEventId);

  return {
    eventTitle: firstNonEmpty_([event.summary, context.eventTitle], t_('common.untitledEvent', null, activeLocale)),
    newEndMs: newEndMs,
    newEndIso: newEnd.toISOString(),
    endDateTimeLabel: formatTimeForUser_(newEnd, effectiveTimeZone)
  };
}

function escapeRegex_(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
