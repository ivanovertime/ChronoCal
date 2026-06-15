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

  if (!getSettings_().writeDescription) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: buildEventContextFromSession_(targetSession),
      sessions: sessions
    }), 'La modificación de descripción está desactivada. Exporta a Sheets en su lugar.');
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

function onPauseAll(e) {
  var sessions = getSessions_();
  var count = pauseAllSessions_(sessions, Date.now());
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions),
    sessions: sessions
  }), count ? ('Pausados ' + count + ' eventos.') : 'No hay eventos en ejecución.');
}

function onStopAll(e) {
  var sessions = getSessions_();
  var count = stopAllSessions_(sessions, Date.now());
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions),
    sessions: sessions
  }), count ? ('Detenidos ' + count + ' eventos.') : 'No hay eventos activos.');
}

function onExportToSheets(e) {
  var sessions = getSessions_();
  var stopped = getStoppedSessions_(sessions);

  if (!stopped.length) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, sessions),
      sessions: sessions
    }), 'Detén un evento antes de exportarlo a Sheets.');
  }

  try {
    var result = exportSessionsToSheets_(stopped);
    for (var i = 0; i < stopped.length; i++) {
      sessions = removeSessionByEvent_(sessions, buildEventContextFromSession_(stopped[i]));
    }
    saveSessions_(sessions);

    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, sessions),
      sessions: sessions
    }), 'Exportadas ' + result.count + ' sesiones a Google Sheets.');
  } catch (error) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, sessions),
      sessions: sessions
    }), (error && error.message ? error.message : 'No se pudo exportar a Sheets.') + ' Sesiones conservadas.');
  }
}

function onExportSessionToSheets(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);

  if (!targetSession) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions
    }), 'No hay una sesión para exportar en este evento.');
  }

  try {
    var result = exportSessionsToSheets_([targetSession]);
    sessions = removeSessionByEvent_(sessions, buildEventContextFromSession_(targetSession));
    saveSessions_(sessions);

    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, sessions),
      sessions: sessions
    }), 'Sesión exportada a Google Sheets (' + result.count + ').');
  } catch (error) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: buildEventContextFromSession_(targetSession),
      sessions: sessions
    }), (error && error.message ? error.message : 'No se pudo exportar a Sheets.') + ' Sesión conservada.');
  }
}

function onToggleDescriptionMode(e) {
  var settings = getSettings_();
  settings.writeDescription = !settings.writeDescription;
  saveSettings_(settings);

  var sessions = getSessions_();
  return buildNotificationResponse_(buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions),
    sessions: sessions
  }), settings.writeDescription
    ? 'Se podrá modificar la descripción del evento.'
    : 'No se modificará la descripción del evento.');
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
