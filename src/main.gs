function buildHomeCard(e) {
  var activeSession = getActiveSession_();
  var lastResult = getLastResult_();

  return buildBaseCard_({
    eventContext: resolveCardEventContext_(e, activeSession, lastResult),
    activeSession: activeSession,
    lastResult: lastResult
  });
}

function buildEventCard(e) {
  var activeSession = getActiveSession_();
  var lastResult = getLastResult_();

  return buildBaseCard_({
    eventContext: resolveCardEventContext_(e, activeSession, lastResult),
    activeSession: activeSession,
    lastResult: lastResult
  });
}

function onRefreshCard(e) {
  return refreshCard_(e, 'Panel actualizado.');
}

function onStartTracking(e) {
  var context = getEventContext_(e);
  var activeSession = getActiveSession_();

  if (!context.eventId) {
    return buildNotificationResponse_(buildHomeCard(e), 'No se pudo identificar el evento actual.');
  }

  if (activeSession && !isSameEvent_(activeSession, context)) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      activeSession: activeSession
    }), 'Ya existe una sesión activa en otro evento. Pausa o detén esa sesión antes de iniciar otra.');
  }

  if (activeSession && isSameEvent_(activeSession, context) && activeSession.status === 'RUNNING') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      activeSession: activeSession
    }), 'Esta sesión ya está en ejecución.');
  }

  if (activeSession && isSameEvent_(activeSession, context) && activeSession.status === 'PAUSED') {
    return onResumeTracking(e);
  }

  var now = new Date();
  saveActiveSession_({
    active_event_id: context.eventId,
    calendar_id: context.calendarId,
    event_title: context.eventTitle,
    started_at_ms: now.getTime(),
    started_at_iso: now.toISOString(),
    elapsed_ms: 0,
    status: 'RUNNING'
  });

  clearLastResult_();

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: context,
    activeSession: getActiveSession_(),
    lastResult: null
  }), 'Tracking iniciado.');
}

function onPauseTracking(e) {
  var context = getEventContext_(e);
  var activeSession = getActiveSession_();
  var targetContext = activeSession ? buildEventContextFromSession_(activeSession) : context;

  if (!activeSession || activeSession.status !== 'RUNNING') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      activeSession: activeSession,
      lastResult: getLastResult_()
    }), 'No hay una sesión activa en ejecución para este evento.');
  }

  var nowMs = Date.now();
  var startedAtMs = Number(activeSession.started_at_ms || nowMs);
  activeSession.elapsed_ms = Number(activeSession.elapsed_ms || 0) + Math.max(0, nowMs - startedAtMs);
  activeSession.started_at_ms = nowMs;
  activeSession.status = 'PAUSED';
  saveActiveSession_(activeSession);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: targetContext,
    activeSession: activeSession,
    lastResult: getLastResult_()
  }), 'Tracking pausado.');
}

function onResumeTracking(e) {
  var context = getEventContext_(e);
  var activeSession = getActiveSession_();
  var targetContext = activeSession ? buildEventContextFromSession_(activeSession) : context;

  if (!activeSession || activeSession.status !== 'PAUSED') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      activeSession: activeSession,
      lastResult: getLastResult_()
    }), 'No hay una sesión pausada para este evento.');
  }

  activeSession.started_at_ms = Date.now();
  activeSession.status = 'RUNNING';
  saveActiveSession_(activeSession);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: targetContext,
    activeSession: activeSession,
    lastResult: getLastResult_()
  }), 'Tracking reanudado.');
}

function onStopTracking(e) {
  var context = getEventContext_(e);
  var activeSession = getActiveSession_();

  if (!activeSession) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      activeSession: activeSession,
      lastResult: getLastResult_()
    }), 'No hay una sesión activa para este evento.');
  }

  var durationMs = calculateSessionDurationMs_(activeSession);
  var normalizedContext = buildEventContextFromSession_(activeSession) || resolveCardEventContext_(e, activeSession, getLastResult_()) || context;
  var result = {
    event_id: normalizedContext.eventId,
    calendar_id: normalizedContext.calendarId,
    event_title: normalizedContext.eventTitle,
    time_zone: normalizedContext.timeZone,
    duration_ms: durationMs,
    stopped_at_iso: new Date().toISOString()
  };

  saveLastResult_(result);
  clearActiveSession_();

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: buildEventContextFromResult_(result),
    activeSession: null,
    lastResult: result
  }), 'Sesión detenida. Usa "Guardar en evento" solo si quieres escribir en Calendar.');
}

function onSaveLastResultToEvent(e) {
  var context = getEventContext_(e);
  var lastResult = getLastResult_();
  var activeSession = getActiveSession_();

  if (!lastResult) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, activeSession, null),
      activeSession: activeSession,
      lastResult: null
    }), 'No hay resultados pendientes para guardar.');
  }

  var targetContext = buildEventContextFromResult_(lastResult);

  try {
    var updateResult = updateEventDescription_(targetContext, Number(lastResult.duration_ms || 0));
    clearLastResult_();
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: targetContext,
      activeSession: activeSession,
      lastResult: null
    }), 'Evento actualizado con éxito: ' + updateResult.durationLine);
  } catch (error) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: targetContext,
      activeSession: activeSession,
      lastResult: lastResult
    }), (error && error.message ? error.message : 'No se pudo guardar en el evento.') + ' Resultado pendiente conservado.');
  }
}

function onDiscardLastResult(e) {
  var activeSession = getActiveSession_();
  var context = resolveCardEventContext_(e, activeSession, getLastResult_());
  clearLastResult_();

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: context,
    activeSession: activeSession,
    lastResult: null
  }), 'Resultado pendiente descartado.');
}

function refreshCard_(e, message) {
  var activeSession = getActiveSession_();
  var lastResult = getLastResult_();
  var eventContext = resolveCardEventContext_(e, activeSession, lastResult);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: eventContext,
    activeSession: activeSession,
    lastResult: lastResult
  }), message || 'Actualizado.');
}

function resolveCardEventContext_(e, activeSession, lastResult) {
  var context = getEventContext_(e);

  if (!context.eventId && activeSession) {
    context = buildEventContextFromSession_(activeSession);
  }

  if (!context.eventId && lastResult) {
    context = buildEventContextFromResult_(lastResult);
  }

  if (!context || !context.eventId) {
    return null;
  }

  if (isUntitledEvent_(context.eventTitle) && activeSession && isSameEvent_(activeSession, context)) {
    context.eventTitle = activeSession.event_title || context.eventTitle;
  }

  if (isUntitledEvent_(context.eventTitle) && lastResult && lastResult.event_id === context.eventId && lastResult.calendar_id === context.calendarId) {
    context.eventTitle = lastResult.event_title || context.eventTitle;
  }

  return context;
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

function buildNotificationResponse_(card, message) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .setNotification(CardService.newNotification().setText(message))
    .build();
}
