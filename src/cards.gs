function buildBaseCard_(options) {
  var eventContext = options.eventContext || null;
  var sessions = options.sessions || [];
  var settings = options.settings || getSettings_();
  var locale = getSupportedLocale_(options.locale || settings.userLocale) || CHRONOCAL_CONFIG.defaultLocale;
  var entries = buildTrackingEntries_(eventContext, sessions);

  var cardBuilder = CardService.newCardBuilder();
  cardBuilder.addSection(buildStatusSection_(eventContext, sessions, locale));

  var footer = buildFixedFooter_(sessions, locale);
  if (footer) {
    cardBuilder.setFixedFooter(footer);
  }

  if (entries.length === 0) {
    cardBuilder.addSection(buildOnboardingSection_(locale));
  } else {
    for (var i = 0; i < entries.length; i++) {
      cardBuilder.addSection(buildEntrySection_(entries[i], settings, locale));
    }
  }

  return cardBuilder.build();
}

function buildOnboardingSection_(locale) {
  var section = CardService.newCardSection()
    .setHeader(t_('onboarding.title', null, locale));

  section.addWidget(
    CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.CLOCK))
      .setTopLabel(t_('onboarding.step1Title', null, locale))
      .setText(t_('onboarding.step1Body', null, locale))
      .setWrapText(true)
  );

  section.addWidget(
    CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.VIDEO_PLAY))
      .setTopLabel(t_('onboarding.step2Title', null, locale))
      .setText(t_('onboarding.step2Body', null, locale))
      .setWrapText(true)
  );

  section.addWidget(
    CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.DESCRIPTION || CardService.Icon.CLOCK))
      .setTopLabel(t_('onboarding.step3Title', null, locale))
      .setText(t_('onboarding.step3Body', null, locale))
      .setWrapText(true)
  );

  section.addWidget(
    CardService.newDecoratedText()
      .setText(t_('onboarding.privacyBadge', null, locale))
      .setWrapText(true)
  );

  return section;
}

function buildStatusSection_(eventContext, sessions, locale) {
  var section = CardService.newCardSection();
  var state = getCardState_(sessions);
  var totalLabel = formatDurationCompact_(getTodayTotalMs_(sessions, Date.now())) + ' ' + t_('card.today', null, locale);
  var text;
  var bottom = '';

  if (state === 'RUNNING') {
    var running = getRunningSession_(sessions);
    text = t_('status.working', null, locale) + ' · ' + totalLabel;
    if (running && running.event_title) {
      bottom = running.event_title;
    }
  } else if (state === 'PAUSED') {
    text = t_('status.onBreak', null, locale) + ' · ' + totalLabel;
    var pausedList = (sessions || []).filter(function(s) {
      return s.status === 'PAUSED';
    });
    if (pausedList.length === 1 && pausedList[0].event_title) {
      bottom = pausedList[0].event_title;
    } else if (pausedList.length > 1) {
      bottom = t_('notify.pausedCount', { count: pausedList.length }, locale);
    }
  } else if (state === 'STOPPED') {
    text = t_('status.dayFinished', null, locale) + ' · ' + totalLabel;
  } else {
    text = t_('status.notStarted', null, locale);
    if (eventContext && eventContext.eventId) {
      bottom = eventContext.eventTitle;
    } else {
      bottom = t_('card.emptyTrackingBody', null, locale);
    }
  }

  var widget = CardService.newDecoratedText()
    .setStartIcon(CardService.newIconImage().setIcon(statusIcon_(state)))
    .setText(text)
    .setWrapText(true)
    .setButton(CardService.newTextButton()
      .setText(t_('card.refresh', null, locale))
      .setOnClickAction(buildGlobalAction_('onRefreshCard')));

  if (bottom) {
    widget.setBottomLabel(bottom);
  }

  section.addWidget(widget);
  return section;
}

function getCardState_(sessions) {
  if (getRunningSession_(sessions || [])) {
    return 'RUNNING';
  }

  var list = sessions || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].status === 'PAUSED') {
      return 'PAUSED';
    }
  }

  if (getStoppedSessions_(list).length) {
    return 'STOPPED';
  }

  return 'NONE';
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

  var durationText = session ? formatDuration_(calculateSessionDurationMs_(session)) : '00:00:00';
  var bottomLabel = t_('card.timeLabel', null, locale) + ': ' + durationText;
  if (status === 'RUNNING' && session && session.started_at_ms) {
    var timeStr = formatTimeForUser_(new Date(session.started_at_ms), context.timeZone || 'Etc/UTC');
    bottomLabel += ' (' + t_('card.sincePrefix', null, locale) + ' ' + timeStr + ') · ' + t_('card.activeHint', null, locale);
  }

  section.addWidget(
    CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage().setIcon(statusIcon_(status)))
      .setTopLabel(statusLabel_(status, locale) + (entry.isOpen ? (' · ' + t_('card.openSuffix', null, locale)) : ''))
      .setText(title)
      .setBottomLabel(bottomLabel)
      .setWrapText(true)
  );

  section.addWidget(buildEntryActions_(status, context, settings, locale));

  return section;
}

function buildEntryActions_(status, context, settings, locale) {
  var buttons = CardService.newButtonSet();

  if (status === 'RUNNING') {
    buttons.addButton(createButton_(t_('action.pause', null, locale), 'onPauseTracking', context, false));
    buttons.addButton(createButton_(t_('action.stop', null, locale), 'onStopTracking', context, true));
  } else if (status === 'PAUSED') {
    buttons.addButton(createButton_(t_('action.resume', null, locale), 'onResumeTracking', context, true));
    buttons.addButton(createButton_(t_('action.stop', null, locale), 'onStopTracking', context, false));
    buttons.addButton(createButton_(t_('action.discard', null, locale), 'onDiscardSession', context, false));
  } else if (status === 'STOPPED') {
    buttons.addButton(createButton_(buildStopModeApplyLabel_(settings, locale), 'onSaveSession', context, true));
    if (settings.sheetsExportEnabled) {
      buttons.addButton(createButton_(t_('action.export', null, locale), 'onExportSessionToSheets', context, false));
    }
    buttons.addButton(createButton_(t_('action.discard', null, locale), 'onDiscardSession', context, false));
  } else {
    buttons.addButton(createButton_(t_('action.start', null, locale), 'onStartTracking', context, true));
  }

  return buttons;
}

function buildSettingsCard_(options) {
  var settings = options.settings || getSettings_();
  var locale = getSupportedLocale_(options.locale || settings.userLocale) || CHRONOCAL_CONFIG.defaultLocale;

  var cardBuilder = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(t_('settings.title', null, locale)));

  cardBuilder.addSection(buildTrackingSettingsSection_(settings, locale));
  cardBuilder.addSection(buildExportSettingsSection_(settings, locale));
  cardBuilder.addSection(buildLanguageSettingsSection_(settings, locale));
  cardBuilder.addSection(buildAboutSection_(locale));
  cardBuilder.addSection(buildSettingsNavSection_(locale));

  return cardBuilder.build();
}

function buildTrackingSettingsSection_(settings, locale) {
  var section = CardService.newCardSection().setHeader(t_('settings.trackingSection', null, locale));

  var stopModeInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName('stopMode')
    .setOnChangeAction(buildGlobalAction_('onStopModeChange'));
  var modes = CHRONOCAL_CONFIG.stopModes || ['DESCRIPTION', 'END_TIME', 'BOTH'];
  for (var i = 0; i < modes.length; i++) {
    stopModeInput.addItem(getStopModeLabel_(modes[i], locale), modes[i], modes[i] === settings.stopMode);
  }

  section.addWidget(
    CardService.newDecoratedText()
      .setTopLabel(t_('settings.stopModeLabel', null, locale))
      .setText(t_('settings.stopModeCurrent', null, locale) + ': ' + getStopModeLabel_(settings.stopMode, locale))
      .setWrapText(true)
  );
  section.addWidget(stopModeInput);

  section.addWidget(
    CardService.newDecoratedText()
      .setTopLabel(t_('settings.descriptionLabel', null, locale))
      .setText(settings.writeDescription
        ? t_('settings.on', null, locale)
        : t_('settings.off', null, locale))
      .setSwitchControl(CardService.newSwitch()
        .setFieldName('writeDescription')
        .setSelected(settings.writeDescription)
        .setOnChangeAction(buildGlobalAction_('onToggleDescriptionMode')))
  );

  return section;
}

function buildExportSettingsSection_(settings, locale) {
  var section = CardService.newCardSection().setHeader(t_('settings.exportSection', null, locale));
  var spreadSheetValue = settings.sheetsSpreadsheetUrl || settings.sheetsSpreadsheetId;

  section.addWidget(
    CardService.newDecoratedText()
      .setTopLabel(t_('settings.sheetsExportLabel', null, locale))
      .setText(settings.sheetsExportEnabled
        ? t_('settings.on', null, locale)
        : t_('settings.off', null, locale))
      .setSwitchControl(CardService.newSwitch()
        .setFieldName('sheetsExportEnabled')
        .setSelected(settings.sheetsExportEnabled)
        .setOnChangeAction(buildGlobalAction_('onToggleSheetsExport')))
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('sheetsTarget')
      .setTitle(t_('settings.spreadsheetLabel', null, locale))
      .setHint(t_('settings.spreadsheetHint', null, locale))
      .setValue(spreadSheetValue)
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('sheetName')
      .setTitle(t_('settings.sheetNameLabel', null, locale))
      .setValue(settings.sheetsSheetName)
  );

  var buttonSet = CardService.newButtonSet();
  var saveSettingsBtn = CardService.newTextButton()
    .setText(t_('settings.saveSettings', null, locale))
    .setOnClickAction(buildGlobalAction_('onSaveSettings'));
  if (CardService.TextButtonStyle && CardService.TextButtonStyle.FILLED) {
    saveSettingsBtn.setTextButtonStyle(CardService.TextButtonStyle.FILLED);
  }
  buttonSet.addButton(saveSettingsBtn);
  buttonSet.addButton(CardService.newTextButton()
    .setText(t_('settings.createSpreadsheet', null, locale))
    .setOnClickAction(buildGlobalAction_('onCreateSpreadsheet')));
  if (settings.sheetsSpreadsheetUrl) {
    buttonSet.addButton(CardService.newTextButton()
      .setText(t_('settings.openSpreadsheet', null, locale))
      .setOpenLink(CardService.newOpenLink().setUrl(settings.sheetsSpreadsheetUrl).setOpenAs(CardService.OpenAs.FULL_SIZE)));
  }
  section.addWidget(buttonSet);

  return section;
}

function buildLanguageSettingsSection_(settings, locale) {
  var section = CardService.newCardSection().setHeader(t_('settings.languageLabel', null, locale));

  var languageInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName('language')
    .setOnChangeAction(buildGlobalAction_('onLanguageChange'))
    .addItem('Español', 'es', settings.userLocale === 'es')
    .addItem('English', 'en', settings.userLocale === 'en');

  section.addWidget(languageInput);

  return section;
}

function buildAboutSection_(locale) {
  var section = CardService.newCardSection()
    .setHeader(t_('settings.aboutSection', null, locale));

  section.addWidget(
    CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.STAR || CardService.Icon.CLOCK))
      .setTopLabel(t_('settings.versionLabel', null, locale))
      .setText('ChronoCal v1.0.0')
      .setBottomLabel(t_('settings.privacyNotice', null, locale))
      .setWrapText(true)
  );

  var docsUrl = 'https://github.com/ivanovertime/ChronoCal';
  section.addWidget(
    CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.BOOKMARK || CardService.Icon.CLOCK))
      .setText(t_('settings.helpAndDocs', null, locale))
      .setWrapText(true)
      .setOpenLink(CardService.newOpenLink().setUrl(docsUrl).setOpenAs(CardService.OpenAs.FULL_SIZE))
  );

  return section;
}

function buildSettingsNavSection_(locale) {
  var section = CardService.newCardSection();
  var buttons = CardService.newButtonSet();
  buttons.addButton(CardService.newTextButton()
    .setText(t_('action.back', null, locale))
    .setOnClickAction(buildGlobalAction_('onCloseSettings')));
  section.addWidget(buttons);

  return section;
}

function buildStopModeApplyLabel_(settings, locale) {
  if (settings.stopMode === 'END_TIME') {
    return t_('settings.saveEndTime', null, locale);
  }
  if (settings.stopMode === 'BOTH') {
    return t_('settings.saveBoth', null, locale);
  }
  return t_('settings.saveDescription', null, locale);
}

function buildFixedFooter_(sessions, locale) {
  var state = getCardState_(sessions);

  if (state === 'NONE') {
    return null;
  }

  if (state === 'STOPPED') {
    return CardService.newFixedFooter()
      .setPrimaryButton(footerButton_(t_('action.exportToSheets', null, locale), 'onExportToSheets', true));
  }

  var primary;
  if (state === 'RUNNING') {
    primary = footerButton_(t_('action.break', null, locale), 'onPauseAll', false);
  } else {
    primary = footerButton_(t_('action.resumeAll', null, locale), 'onResumeAll', true);
  }

  var secondary = footerButton_(t_('action.finishWork', null, locale), 'onFinishWork', state === 'RUNNING');

  return CardService.newFixedFooter()
    .setPrimaryButton(primary)
    .setSecondaryButton(secondary);
}

function footerButton_(label, functionName, isPrimary) {
  var button = CardService.newTextButton()
    .setText(label)
    .setOnClickAction(buildGlobalAction_(functionName));

  if (isPrimary && CardService.TextButtonStyle && CardService.TextButtonStyle.FILLED) {
    button.setTextButtonStyle(CardService.TextButtonStyle.FILLED);
  }

  return button;
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

function createButton_(label, functionName, context, isPrimary) {
  var button = CardService.newTextButton()
    .setText(label)
    .setOnClickAction(buildCardAction_(functionName, context));

  if (isPrimary && CardService.TextButtonStyle && CardService.TextButtonStyle.FILLED) {
    button.setTextButtonStyle(CardService.TextButtonStyle.FILLED);
  }

  return button;
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

