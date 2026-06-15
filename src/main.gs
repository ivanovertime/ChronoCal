function buildHomeCard(e) {
  var sessions = getSessions_();
  var eventContext = resolveCardEventContext_(e, sessions);

  return buildBaseCard_({
    eventContext: eventContext,
    sessions: sessions
  });
}

function buildEventCard(e) {
  var sessions = getSessions_();
  var eventContext = resolveCardEventContext_(e, sessions);

  return buildBaseCard_({
    eventContext: eventContext,
    sessions: sessions
  });
}

function onRefreshCard(e) {
  return refreshCard_(e, 'Panel actualizado.');
}

function onStartTracking(e) {
  var context = enrichEventContextFromCalendar_(getEventContext_(e));
  var sessions = getSessions_();
  var currentSession = getSessionForEvent_(sessions, context);
  var nowMs = Date.now();

  if (!context.eventId) {
    return buildNotificationResponse_(buildHomeCard(e), 'No se pudo identificar el evento actual.');
  }

  if (currentSession && currentSession.status === 'RUNNING') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions
    }), 'Esta sesión ya está en ejecución.');
  }

  if (currentSession && (currentSession.status === 'PAUSED' || currentSession.status === 'STOPPED')) {
    resumeSessionInPlace_(currentSession, nowMs);
    saveSessions_(sessions);

    return buildNotificationResponse_(buildBaseCard_({
      eventContext: buildEventContextFromSession_(currentSession),
      sessions: sessions
    }), 'Tracking reanudado.');
  }

  currentSession = {
    active_event_id: context.eventId,
    calendar_id: context.calendarId,
    event_title: context.eventTitle,
    time_zone: context.timeZone,
    started_at_ms: nowMs,
    started_at_iso: new Date(nowMs).toISOString(),
    elapsed_ms: 0,
    status: 'RUNNING'
  };
  sessions.push(currentSession);
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: buildEventContextFromSession_(currentSession),
    sessions: sessions
  }), 'Tracking iniciado.');
}

function onPauseTracking(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);
  var targetContext = targetSession ? buildEventContextFromSession_(targetSession) : context;

  if (!targetSession || targetSession.status !== 'RUNNING') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions
    }), 'No hay una sesión activa en ejecución para este evento.');
  }

  pauseSessionInPlace_(targetSession, Date.now());
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: targetContext,
    sessions: sessions
  }), 'Tracking pausado.');
}

function onResumeTracking(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);
  var nowMs = Date.now();

  if (!targetSession || targetSession.status !== 'PAUSED') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions
    }), 'No hay una sesión pausada para este evento.');
  }

  resumeSessionInPlace_(targetSession, nowMs);
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: buildEventContextFromSession_(targetSession),
    sessions: sessions
  }), 'Tracking reanudado.');
}

function onStopTracking(e) {
  var context = enrichEventContextFromCalendar_(getEventContext_(e));
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);

  if (!targetSession || targetSession.status === 'STOPPED') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions
    }), 'No hay una sesión activa para este evento.');
  }

  stopSessionInPlace_(targetSession, Date.now());
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: buildEventContextFromSession_(targetSession),
    sessions: sessions
  }), 'Sesión detenida. Pulsa guardar para escribirla en el evento.');
}

function onSaveSession(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);

  if (!targetSession) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions
    }), 'No hay una sesión para guardar en este evento.');
  }

  var targetContext = enrichEventContextFromCalendar_(buildEventContextFromSession_(targetSession));
  var durationMs = calculateSessionDurationMs_(targetSession);

  try {
    var updateResult = updateEventDescription_(targetContext, durationMs);
    sessions = removeSessionByEvent_(sessions, targetContext);
    saveSessions_(sessions);

    return buildNotificationResponse_(buildBaseCard_({
      eventContext: targetContext,
      sessions: sessions
    }), 'Evento actualizado: ' + updateResult.durationLine);
  } catch (error) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: targetContext,
      sessions: sessions
    }), (error && error.message ? error.message : 'No se pudo guardar en el evento.') + ' Sesión conservada.');
  }
}

function onDiscardSession(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetContext = buildEventContextFromSession_(getSessionForEvent_(sessions, context)) || context;

  sessions = removeSessionByEvent_(sessions, targetContext);
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions),
    sessions: sessions
  }), 'Sesión descartada.');
}

// Backward-compatible aliases for the previous single pending-result actions.
function onSaveLastResultToEvent(e) {
  return onSaveSession(e);
}

function onDiscardLastResult(e) {
  return onDiscardSession(e);
}

function refreshCard_(e, message) {
  var sessions = getSessions_();
  var eventContext = resolveCardEventContext_(e, sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: eventContext,
    sessions: sessions
  }), message || 'Actualizado.');
}

function resolveCardEventContext_(e, sessions) {
  var context = getEventContext_(e);
  var runningSession = getRunningSession_(sessions);
  var fallbackSession = sessions && sessions.length ? sessions[0] : null;

  if (!context.eventId && runningSession) {
    context = buildEventContextFromSession_(runningSession);
  }

  if (!context.eventId && fallbackSession) {
    context = buildEventContextFromSession_(fallbackSession);
  }

  if (!context || !context.eventId) {
    return null;
  }

  var sessionForContext = getSessionForEvent_(sessions, context);
  if (isUntitledEvent_(context.eventTitle) && sessionForContext) {
    context.eventTitle = sessionForContext.event_title || context.eventTitle;
  }

  return context;
}

function buildNotificationResponse_(card, message) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .setNotification(CardService.newNotification().setText(message))
    .build();
}
