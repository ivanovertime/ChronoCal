function buildHomeCard(e) {
  var activeSession = getActiveSession_();

  return buildBaseCard_({
    eventContext: activeSession ? buildEventContextFromSession_(activeSession) : null,
    activeSession: activeSession
  });
}

function buildEventCard(e) {
  var eventContext = getEventContext_(e);

  return buildBaseCard_({
    eventContext: eventContext,
    activeSession: getActiveSession_()
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

  if (activeSession && activeSession.status === 'RUNNING' && !isSameEvent_(activeSession, context)) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      activeSession: activeSession
    }), 'Ya existe una sesión activa. Detén la sesión actual antes de iniciar otra.');
  }

  if (activeSession && isSameEvent_(activeSession, context) && activeSession.status === 'RUNNING') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      activeSession: activeSession
    }), 'Esta sesión ya está en ejecución.');
  }

  var now = new Date();
  saveActiveSession_({
    active_event_id: context.eventId,
    calendar_id: context.calendarId,
    event_title: context.eventTitle,
    started_at_ms: now.getTime(),
    started_at_iso: now.toISOString(),
    status: 'RUNNING'
  });

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: context,
    activeSession: getActiveSession_()
  }), 'Tracking iniciado.');
}

function onStopTracking(e) {
  var context = getEventContext_(e);
  var activeSession = getActiveSession_();

  if (!activeSession || !isSameEvent_(activeSession, context)) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      activeSession: activeSession
    }), 'No hay una sesión activa para este evento.');
  }

  var startedAtMs = Number(activeSession.started_at_ms || 0);
  var durationMs = Math.max(0, Date.now() - startedAtMs);
  var updateResult;

  try {
    updateResult = updateEventDescription_(context, activeSession, durationMs);
    clearActiveSession_();
  } catch (error) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      activeSession: activeSession
    }), error.message || 'No se pudo actualizar el evento.');
  }

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: context,
    activeSession: null
  }), 'Evento actualizado con éxito: ' + updateResult.durationLine);
}

function refreshCard_(e, message) {
  var eventContext = getEventContext_(e);
  return buildNotificationResponse_(buildBaseCard_({
    eventContext: eventContext.eventId ? eventContext : null,
    activeSession: getActiveSession_()
  }), message || 'Actualizado.');
}

function buildNotificationResponse_(card, message) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .setNotification(CardService.newNotification().setText(message))
    .build();
}
