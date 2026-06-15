function buildBaseCard_(options) {
  var eventContext = options.eventContext || null;
  var sessions = options.sessions || [];
  var settings = options.settings || getSettings_();
  var locale = getSupportedLocale_(options.locale || settings.userLocale) || CHRONOCAL_CONFIG.defaultLocale;
  var entries = buildTrackingEntries_(eventContext, sessions);

  var cardBuilder = CardService.newCardBuilder();

  if (!entries.length) {
    var emptySection = CardService.newCardSection();
    emptySection.addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.CLOCK))
        .setText(t_('card.emptyTrackingTitle', null, locale))
        .setBottomLabel(t_('card.emptyTrackingBody', null, locale))
        .setWrapText(true)
    );
    cardBuilder.addSection(emptySection);
    cardBuilder.addSection(buildGeneralActionsSection_(sessions, settings, locale));
    cardBuilder.addSection(buildFooterSection_(locale));
    return cardBuilder.build();
  }

  for (var i = 0; i < entries.length; i++) {
    cardBuilder.addSection(buildEntrySection_(entries[i], settings, locale));
  }

  cardBuilder.addSection(buildGeneralActionsSection_(sessions, settings, locale));
  cardBuilder.addSection(buildFooterSection_(locale));

  return cardBuilder.build();
}

function buildTrackingEntries_(eventContext, sessions) {
  var entries = [];
  var seen = {};
  var list = sessions || [];

  if (eventContext && eventContext.eventId) {
    seen[entryKey_(eventContext.calendarId, eventContext.eventId)] = true;
    entries.push({
      context: eventContext,
      session: getSessionForEvent_(list, eventContext),
      isOpen: true
    });
  }

  for (var i = 0; i < list.length; i++) {
    var session = list[i];
    var key = entryKey_(session.calendar_id, session.active_event_id);
    if (seen[key]) {
      continue;
    }
    seen[key] = true;
    entries.push({
      context: buildEventContextFromSession_(session),
      session: session,
      isOpen: false
    });
  }

  return entries;
}

function entryKey_(calendarId, eventId) {
  return (calendarId || 'primary') + '::' + (eventId || '');
}

function buildEntrySection_(entry, settings, locale) {
  var context = entry.context;
  var session = entry.session;
  var status = session ? session.status : 'NONE';
  var section = CardService.newCardSection();

  var title = context.eventTitle && !isUntitledEvent_(context.eventTitle)
    ? context.eventTitle
    : (entry.isOpen ? t_('card.currentEvent', null, locale) : t_('common.untitledEvent', null, locale));

  section.addWidget(
    CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage().setIcon(statusIcon_(status)))
      .setTopLabel(statusLabel_(status, locale) + (entry.isOpen ? (' · ' + t_('card.openSuffix', null, locale)) : ''))
      .setText(title)
      .setBottomLabel(t_('card.timeLabel', null, locale) + ': ' + (session ? formatDuration_(calculateSessionDurationMs_(session)) : '00:00:00'))
      .setWrapText(true)
  );

  section.addWidget(buildEntryActions_(status, context, settings, locale));

  return section;
}

function buildEntryActions_(status, context, settings, locale) {
  var buttons = CardService.newButtonSet();

  if (status === 'RUNNING') {
    buttons.addButton(createIconButton_('pause', t_('action.pause', null, locale), 'onPauseTracking', context));
    buttons.addButton(createIconButton_('stop', t_('action.stop', null, locale), 'onStopTracking', context));
  } else if (status === 'PAUSED') {
    buttons.addButton(createIconButton_('play_arrow', t_('action.resume', null, locale), 'onResumeTracking', context));
    buttons.addButton(createIconButton_('stop', t_('action.stop', null, locale), 'onStopTracking', context));
  } else if (status === 'STOPPED') {
    buttons.addButton(createIconButton_('play_arrow', t_('action.resume', null, locale), 'onResumeTracking', context));
    if (settings.writeDescription) {
      buttons.addButton(createIconButton_('save', t_('action.saveToEventDescription', null, locale), 'onSaveSession', context));
    }
    buttons.addButton(createIconButton_('table_chart', t_('action.exportToSheets', null, locale), 'onExportSessionToSheets', context));
    buttons.addButton(createIconButton_('delete', t_('action.discard', null, locale), 'onDiscardSession', context));
  } else {
    buttons.addButton(createIconButton_('play_arrow', t_('action.start', null, locale), 'onStartTracking', context));
  }

  return buttons;
}

function buildGeneralActionsSection_(sessions, settings, locale) {
  var section = CardService.newCardSection().setHeader(t_('card.generalActions', null, locale));
  var buttons = CardService.newButtonSet();

  buttons.addButton(createGlobalIconButton_('pause', t_('action.pauseAll', null, locale), 'onPauseAll'));
  buttons.addButton(createGlobalIconButton_('stop', t_('action.stopAll', null, locale), 'onStopAll'));
  buttons.addButton(createGlobalIconButton_('table_chart', t_('action.exportToSheets', null, locale), 'onExportToSheets'));
  buttons.addButton(createGlobalIconButton_('refresh', t_('action.refreshTimes', null, locale), 'onRefreshCard'));
  buttons.addButton(createGlobalIconButton_(settings.writeDescription ? 'edit' : 'edit_off', settings.writeDescription
    ? t_('action.descriptionEnabled', null, locale)
    : t_('action.descriptionDisabled', null, locale), 'onToggleDescriptionMode'));
  buttons.addButton(createGlobalIconButton_('translate', locale === 'es'
    ? t_('action.languageSwitchToEnglish', null, locale)
    : t_('action.languageSwitchToSpanish', null, locale), 'onToggleLanguage'));

  section.addWidget(buttons);
  return section;
}

function buildFooterSection_(locale) {
  var section = CardService.newCardSection();
  var docsLink = CardService.newOpenLink()
    .setUrl(CHRONOCAL_CONFIG.docsUrl)
    .setOpenAs(CardService.OpenAs.FULL_SIZE)
    .setOnClose(CardService.OnClose.NOTHING);

  section.addWidget(
    CardService.newTextButton()
      .setText(t_('common.docs', null, locale))
      .setOpenLink(docsLink)
  );
  return section;
}

function statusLabel_(status, locale) {
  if (status === 'RUNNING') {
    return t_('status.running', null, locale);
  }
  if (status === 'PAUSED') {
    return t_('status.paused', null, locale);
  }
  if (status === 'STOPPED') {
    return t_('status.stopped', null, locale);
  }
  return t_('status.notStarted', null, locale);
}

function statusIcon_(status) {
  if (status === 'RUNNING') {
    return CardService.Icon.VIDEO_PLAY;
  }
  return CardService.Icon.CLOCK;
}

function createIconButton_(iconName, altText, functionName, context) {
  return CardService.newImageButton()
    .setAltText(altText)
    .setIconUrl(chronoActionIconUrl_(iconName))
    .setOnClickAction(buildCardAction_(functionName, context));
}

function createGlobalIconButton_(iconName, altText, functionName) {
  return CardService.newImageButton()
    .setAltText(altText)
    .setIconUrl(chronoActionIconUrl_(iconName))
    .setOnClickAction(buildGlobalAction_(functionName));
}

function chronoActionIconUrl_(iconName) {
  return 'https://www.gstatic.com/images/icons/material/system/1x/' + iconName + '_grey600_24dp.png';
}

function buildGlobalAction_(functionName) {
  return CardService.newAction().setFunctionName(functionName);
}

function buildCardAction_(functionName, eventContext) {
  return CardService.newAction()
    .setFunctionName(functionName)
    .setParameters({
      eventId: eventContext.eventId,
      calendarId: eventContext.calendarId,
      eventTitle: eventContext.eventTitle,
      timeZone: eventContext.timeZone
    });
}

