function buildHomeCard(e) {
  var sessions = getSessions_();
  var eventContext = resolveCardEventContext_(e, sessions);
  var locale = getCurrentLocale_(e);

  return buildBaseCard_({
    eventContext: eventContext,
    sessions: sessions,
    locale: locale
  });
}

function buildEventCard(e) {
  var sessions = getSessions_();
  var eventContext = resolveCardEventContext_(e, sessions);
  var locale = getCurrentLocale_(e);

  return buildBaseCard_({
    eventContext: eventContext,
    sessions: sessions,
    locale: locale
  });
}

function onRefreshCard(e) {
  return refreshCard_(e, t_('notify.panelUpdated', null, getCurrentLocale_(e)));
}

function onStartTracking(e) {
  var context = enrichEventContextFromCalendar_(getEventContext_(e));
  var sessions = getSessions_();
  var currentSession = getSessionForEvent_(sessions, context);
  var nowMs = Date.now();
  var locale = getCurrentLocale_(e);

  if (!context.eventId) {
    return buildNotificationResponse_(buildHomeCard(e), t_('notify.cannotIdentifyCurrentEvent', null, locale));
  }

  if (currentSession && currentSession.status === 'RUNNING') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      locale: locale
    }), t_('notify.sessionAlreadyRunning', null, locale));
  }

  if (currentSession && (currentSession.status === 'PAUSED' || currentSession.status === 'STOPPED')) {
    resumeSessionInPlace_(currentSession, nowMs);
    saveSessions_(sessions);

    return buildNotificationResponse_(buildBaseCard_({
      eventContext: buildEventContextFromSession_(currentSession),
      sessions: sessions,
      locale: locale
    }), t_('notify.trackingResumed', null, locale));
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
    sessions: sessions,
    locale: locale
  }), t_('notify.trackingStarted', null, locale));
}

function onPauseTracking(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);
  var targetContext = targetSession ? buildEventContextFromSession_(targetSession) : context;
  var locale = getCurrentLocale_(e);

  if (!targetSession || targetSession.status !== 'RUNNING') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      locale: locale
    }), t_('notify.noRunningSessionForEvent', null, locale));
  }

  pauseSessionInPlace_(targetSession, Date.now());
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: targetContext,
    sessions: sessions,
    locale: locale
  }), t_('notify.trackingPaused', null, locale));
}

function onResumeTracking(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);
  var nowMs = Date.now();
  var locale = getCurrentLocale_(e);

  if (!targetSession || targetSession.status !== 'PAUSED') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      locale: locale
    }), t_('notify.noPausedSessionForEvent', null, locale));
  }

  resumeSessionInPlace_(targetSession, nowMs);
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: buildEventContextFromSession_(targetSession),
    sessions: sessions,
    locale: locale
  }), t_('notify.trackingResumed', null, locale));
}

function onStopTracking(e) {
  var context = enrichEventContextFromCalendar_(getEventContext_(e));
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);
  var locale = getCurrentLocale_(e);

  if (!targetSession || targetSession.status === 'STOPPED') {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      locale: locale
    }), t_('notify.noActiveSessionForEvent', null, locale));
  }

  stopSessionInPlace_(targetSession, Date.now());
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: buildEventContextFromSession_(targetSession),
    sessions: sessions,
    locale: locale
  }), t_('notify.sessionStoppedSavePrompt', null, locale));
}

function onSaveSession(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);
  var locale = getCurrentLocale_(e);

  if (!targetSession) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      locale: locale
    }), t_('notify.noSessionToSave', null, locale));
  }

  if (!getSettings_().writeDescription) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: buildEventContextFromSession_(targetSession),
      sessions: sessions,
      locale: locale
    }), t_('notify.descriptionDisabledExportInstead', null, locale));
  }

  var targetContext = enrichEventContextFromCalendar_(buildEventContextFromSession_(targetSession));
  var durationMs = calculateSessionDurationMs_(targetSession);

  try {
    var updateResult = updateEventDescription_(targetContext, durationMs, locale);
    sessions = removeSessionByEvent_(sessions, targetContext);
    saveSessions_(sessions);

    return buildNotificationResponse_(buildBaseCard_({
      eventContext: targetContext,
      sessions: sessions,
      locale: locale
    }), t_('notify.eventUpdated', {
      durationLine: updateResult.durationLine
    }, locale));
  } catch (error) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: targetContext,
      sessions: sessions,
      locale: locale
    }), (error && error.message ? error.message : t_('notify.saveToEventFailed', null, locale)) + ' ' + t_('notify.sessionKept', null, locale));
  }
}

function onDiscardSession(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetContext = buildEventContextFromSession_(getSessionForEvent_(sessions, context)) || context;
  var locale = getCurrentLocale_(e);

  sessions = removeSessionByEvent_(sessions, targetContext);
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions),
    sessions: sessions,
    locale: locale
  }), t_('notify.sessionDiscarded', null, locale));
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
  var locale = getCurrentLocale_(e);
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions),
    sessions: sessions,
    locale: locale
  }), count ? t_('notify.pausedCount', { count: count }, locale) : t_('notify.noRunningEvents', null, locale));
}

function onStopAll(e) {
  var sessions = getSessions_();
  var count = stopAllSessions_(sessions, Date.now());
  var locale = getCurrentLocale_(e);
  saveSessions_(sessions);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions),
    sessions: sessions,
    locale: locale
  }), count ? t_('notify.stoppedCount', { count: count }, locale) : t_('notify.noActiveEvents', null, locale));
}

function onExportToSheets(e) {
  var sessions = getSessions_();
  var stopped = getStoppedSessions_(sessions);
  var locale = getCurrentLocale_(e);

  if (!stopped.length) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, sessions),
      sessions: sessions,
      locale: locale
    }), t_('notify.stopBeforeExport', null, locale));
  }

  try {
    var result = exportSessionsToSheets_(stopped, locale);
    for (var i = 0; i < stopped.length; i++) {
      sessions = removeSessionByEvent_(sessions, buildEventContextFromSession_(stopped[i]));
    }
    saveSessions_(sessions);

    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, sessions),
      sessions: sessions,
      locale: locale
    }), t_('notify.exportManySuccess', { count: result.count }, locale));
  } catch (error) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, sessions),
      sessions: sessions,
      locale: locale
    }), (error && error.message ? error.message : t_('notify.exportFailed', null, locale)) + ' ' + t_('notify.sessionsKept', null, locale));
  }
}

function onExportSessionToSheets(e) {
  var context = getEventContext_(e);
  var sessions = getSessions_();
  var targetSession = getSessionForEvent_(sessions, context);
  var locale = getCurrentLocale_(e);

  if (!targetSession) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: context,
      sessions: sessions,
      locale: locale
    }), t_('notify.noSessionToExport', null, locale));
  }

  try {
    var result = exportSessionsToSheets_([targetSession], locale);
    sessions = removeSessionByEvent_(sessions, buildEventContextFromSession_(targetSession));
    saveSessions_(sessions);

    return buildNotificationResponse_(buildBaseCard_({
      eventContext: resolveCardEventContext_(e, sessions),
      sessions: sessions,
      locale: locale
    }), t_('notify.exportOneSuccess', { count: result.count }, locale));
  } catch (error) {
    return buildNotificationResponse_(buildBaseCard_({
      eventContext: buildEventContextFromSession_(targetSession),
      sessions: sessions,
      locale: locale
    }), (error && error.message ? error.message : t_('notify.exportFailed', null, locale)) + ' ' + t_('notify.sessionKept', null, locale));
  }
}

function onToggleDescriptionMode(e) {
  var settings = getSettings_();
  var locale = resolveLocale_(e, settings);
  settings.writeDescription = !settings.writeDescription;
  saveSettings_(settings);

  var sessions = getSessions_();
  return buildNotificationResponse_(buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions),
    sessions: sessions,
    locale: locale
  }), settings.writeDescription
    ? t_('notify.descriptionWriteEnabled', null, locale)
    : t_('notify.descriptionWriteDisabled', null, locale));
}

function onToggleLanguage(e) {
  var settings = getSettings_();
  var currentLocale = resolveLocale_(e, settings);
  var nextLocale = currentLocale === 'es' ? 'en' : 'es';
  settings.userLocale = nextLocale;
  settings.localeSource = 'manual';
  saveSettings_(settings);

  var sessions = getSessions_();
  return buildNotificationResponse_(buildBaseCard_({
    eventContext: resolveCardEventContext_(e, sessions),
    sessions: sessions,
    locale: nextLocale
  }), nextLocale === 'en'
    ? t_('notify.languageChangedEnglish', null, nextLocale)
    : t_('notify.languageChangedSpanish', null, nextLocale));
}

function refreshCard_(e, message) {
  var sessions = getSessions_();
  var eventContext = resolveCardEventContext_(e, sessions);
  var locale = getCurrentLocale_(e);

  return buildNotificationResponse_(buildBaseCard_({
    eventContext: eventContext,
    sessions: sessions,
    locale: locale
  }), message || t_('notify.refreshed', null, locale));
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
