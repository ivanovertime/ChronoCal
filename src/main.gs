function buildHomeCard(e) {
  var sessions = getSessions_();
  var lastResult = getLastResult_();

  return buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions, lastResult),
    sessions: sessions,
    lastResult: lastResult
  });
}

function buildEventCard(e) {
  var sessions = getSessions_();
  var lastResult = getLastResult_();

  return buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions, lastResult),
    sessions: sessions,
    lastResult: lastResult
  });
}

function onRefreshCard(e) {
  return refreshCard_(e, 'Panel actualizado.');
}

function onStartTracking(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var currentSession = getSessionForEvent_(sessions, context);
  var runningSession = getRunningSession_(sessions);
  var nowMs = Date.now();

  if (!context.eventId) {
    return buildNotificationResponse_(buildHomeCard(e), 'No se pudo identificar el evento actual.');
  }

  if (runningSession && !isSameEvent_(runningSession, context)) {
    pauseSessionInPlace_(runningSession, nowMs);
  }

  if (currentSession && currentSession.status === 'RUNNING') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      lastResult: getLastResult_()
    }), 'Esta sesión ya está en ejecución.');
  }

  if (currentSession && currentSession.status === 'PAUSED') {
    resumeSessionInPlace_(currentSession, nowMs);
    saveSessions_(sessions);

    return buildNotificationResponse_(buildBaseCard_({
      eventContext: buildEventContextFromSession_(currentSession),
      sessions: sessions,
      lastResult: getLastResult_()
    }), 'Tracking reanudado.');
  }

  currentSession = {
    active_event_id: context.eventId,
    calendar_id: context.calendarId,
    event_title: context.eventTitle,
    started_at_ms: nowMs,
    started_at_iso: new Date(nowMs).toISOString(),
    elapsed_ms: 0,
    status: 'RUNNING'
  };
  sessions.push(currentSession);
  saveSessions_(sessions);

  clearLastResult_();

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: buildEventContextFromSession_(currentSession),
    sessions: sessions,
    lastResult: null
  }), 'Tracking iniciado.');
}

function onPauseTracking(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var runningSession = getRunningSession_(sessions);
  var targetSession = getSessionForEvent_(sessions, context) || runningSession;
  var targetContext = targetSession ? buildEventContextFromSession_(targetSession) : context;

  if (!targetSession || targetSession.status !== 'RUNNING') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      lastResult: getLastResult_()
    }), 'No hay una sesión activa en ejecución para este evento.');
  }

  pauseSessionInPlace_(targetSession, Date.now());
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: targetContext,
    sessions: sessions,
    lastResult: getLastResult_()
  }), 'Tracking pausado.');
}

function onResumeTracking(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);
  var runningSession = getRunningSession_(sessions);
  var nowMs = Date.now();

  if (!targetSession || targetSession.status !== 'PAUSED') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      lastResult: getLastResult_()
    }), 'No hay una sesión pausada para este evento.');
  }

  if (runningSession && !isSameEvent_(runningSession, context)) {
    pauseSessionInPlace_(runningSession, nowMs);
  }

  resumeSessionInPlace_(targetSession, nowMs);
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: buildEventContextFromSession_(targetSession),
    sessions: sessions,
    lastResult: getLastResult_()
  }), 'Tracking reanudado.');
}

function onStopTracking(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var runningSession = getRunningSession_(sessions);
  var targetSession = getSessionForEvent_(sessions, context) || runningSession;

  if (!targetSession) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      lastResult: getLastResult_()
    }), 'No hay una sesión activa para este evento.');
  }

  var sessionContext = buildEventContextFromSession_(targetSession);
  var durationMs = calculateSessionDurationMs_(targetSession);
  var normalizedContext = sessionContext || resolveCardEventContext_(e, sessions, getLastResult_()) || context;
  var result = {
    event_id: normalizedContext.eventId,
    calendar_id: normalizedContext.calendarId,
    event_title: normalizedContext.eventTitle,
    time_zone: normalizedContext.timeZone,
    duration_ms: durationMs,
    stopped_at_iso: new Date().toISOString()
  };

  sessions = removeSessionByEvent_(sessions, sessionContext);
  saveSessions_(sessions);
  saveLastResult_(result);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: buildEventContextFromResult_(result),
    sessions: sessions,
    lastResult: result
  }), 'Sesión detenida. Usa "Guardar en evento" solo si quieres escribir en Calendar.');
}

function onSaveLastResultToEvent(e) {
  var lastResult = getLastResult_();
  var sessions = getSessions_();

  if (!lastResult) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, sessions, null),
      sessions: sessions,
      lastResult: null
    }), 'No hay resultados pendientes para guardar.');
  }

  var targetContext = buildEventContextFromResult_(lastResult);

  try {
    var updateResult = updateEventDescription_(targetContext, Number(lastResult.duration_ms || 0));
    clearLastResult_();
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: targetContext,
      sessions: sessions,
      lastResult: null
    }), 'Evento actualizado con éxito: ' + updateResult.durationLine);
  } catch (error) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: targetContext,
      sessions: sessions,
      lastResult: lastResult
    }), (error && error.message ? error.message : 'No se pudo guardar en el evento.') + ' Resultado pendiente conservado.');
  }
}

function onDiscardLastResult(e) {
  var sessions = getSessions_();
  var context = resolveCardEventContext_(e, sessions, getLastResult_());
  clearLastResult_();

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: context,
    sessions: sessions,
    lastResult: null
  }), 'Resultado pendiente descartado.');
}

function refreshCard_(e, message) {
  var sessions = getSessions_();
  var lastResult = getLastResult_();
  var eventContext = resolveCardEventContext_(e, sessions, lastResult);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: eventContext,
    sessions: sessions,
    lastResult: lastResult
  }), message || 'Actualizado.');
}

function resolveCardEventContext_(e, sessions, lastResult) {
  var context = getEventContext_(e);
  var runningSession = getRunningSession_(sessions);
  var fallbackSession = sessions && sessions.length ? sessions[0] : null;

  if (!context.eventId && runningSession) {
    context = buildEventContextFromSession_(runningSession);
  }

  if (!context.eventId && fallbackSession) {
    context = buildEventContextFromSession_(fallbackSession);
  }

  if (!context.eventId && lastResult) {
    context = buildEventContextFromResult_(lastResult);
  }

  if (!context || !context.eventId) {
    return null;
  }

  var sessionForContext = getSessionForEvent_(sessions, context);
  if (isUntitledEvent_(context.eventTitle) && sessionForContext) {
    context.eventTitle = sessionForContext.event_title || context.eventTitle;
  }

  if (isUntitledEvent_(context.eventTitle) && lastResult && lastResult.event_id === context.eventId && lastResult.calendar_id === context.calendarId) {
    context.eventTitle = lastResult.event_title || context.eventTitle;
  }

  return context;
}

function buildNotificationResponse_(card, message) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .setNotification(CardService.newNotification().setText(message))
    .build();
}
