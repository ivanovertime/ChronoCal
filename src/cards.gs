function buildBaseCard_(options) {
  var eventContext = options.eventContext || null;
  var sessions = options.sessions || [];
  var settings = options.settings || getSettings_();
  var entries = buildTrackingEntries_(eventContext, sessions);

  var cardBuilder = CardService.newCardBuilder();

  if (!entries.length) {
    var emptySection = CardService.newCardSection();
    emptySection.addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.CLOCK))
        .setText('Sin eventos en seguimiento')
        .setBottomLabel('Abre un evento de Calendar y pulsa iniciar.')
        .setWrapText(true)
    );
    cardBuilder.addSection(emptySection);
    cardBuilder.addSection(buildFooterSection_());
    return cardBuilder.build();
  }

  for (var i = 0; i < entries.length; i++) {
    cardBuilder.addSection(buildEntrySection_(entries[i], settings));
  }

  cardBuilder.addSection(buildGeneralActionsSection_(sessions, settings));
  cardBuilder.addSection(buildFooterSection_());

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

function buildEntrySection_(entry, settings) {
  var context = entry.context;
  var session = entry.session;
  var status = session ? session.status : 'NONE';
  var section = CardService.newCardSection();

  var title = context.eventTitle && !isUntitledEvent_(context.eventTitle)
    ? context.eventTitle
    : (entry.isOpen ? 'Evento actual' : 'Evento sin título');

  section.addWidget(
    CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage().setIcon(statusIcon_(status)))
      .setTopLabel(statusLabel_(status) + (entry.isOpen ? ' · abierto' : ''))
      .setText(title)
      .setBottomLabel('Tiempo: ' + (session ? formatDuration_(calculateSessionDurationMs_(session)) : '00:00:00'))
      .setWrapText(true)
  );

  section.addWidget(buildEntryActions_(status, context, settings));

  return section;
}

function buildEntryActions_(status, context, settings) {
  var buttons = CardService.newButtonSet();

  if (status === 'RUNNING') {
    buttons.addButton(createIconButton_('pause', 'Pausar', 'onPauseTracking', context));
    buttons.addButton(createIconButton_('stop', 'Detener', 'onStopTracking', context));
  } else if (status === 'PAUSED') {
    buttons.addButton(createIconButton_('play_arrow', 'Reanudar', 'onResumeTracking', context));
    buttons.addButton(createIconButton_('stop', 'Detener', 'onStopTracking', context));
  } else if (status === 'STOPPED') {
    buttons.addButton(createIconButton_('play_arrow', 'Reanudar', 'onResumeTracking', context));
    if (settings.writeDescription) {
      buttons.addButton(createIconButton_('save', 'Guardar en la descripción del evento', 'onSaveSession', context));
    }
    buttons.addButton(createIconButton_('table_chart', 'Exportar a Google Sheets', 'onExportSessionToSheets', context));
    buttons.addButton(createIconButton_('delete', 'Descartar', 'onDiscardSession', context));
  } else {
    buttons.addButton(createIconButton_('play_arrow', 'Iniciar', 'onStartTracking', context));
  }

  return buttons;
}

function buildGeneralActionsSection_(sessions, settings) {
  var section = CardService.newCardSection().setHeader('Acciones generales');
  var buttons = CardService.newButtonSet();

  buttons.addButton(createGlobalIconButton_('pause', 'Pausar todo', 'onPauseAll'));
  buttons.addButton(createGlobalIconButton_('stop', 'Detener todo', 'onStopAll'));
  buttons.addButton(createGlobalIconButton_('table_chart', 'Exportar a Google Sheets', 'onExportToSheets'));
  buttons.addButton(createGlobalIconButton_('refresh', 'Actualizar tiempos', 'onRefreshCard'));
  buttons.addButton(createGlobalIconButton_(settings.writeDescription ? 'edit' : 'edit_off', settings.writeDescription ? 'Modificar descripción: activado' : 'Modificar descripción: desactivado', 'onToggleDescriptionMode'));

  section.addWidget(buttons);
  return section;
}

function buildFooterSection_() {
  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newTextParagraph().setText(
      'Docs'
    )
  );
  return section;
}

function statusLabel_(status) {
  if (status === 'RUNNING') {
    return 'En curso';
  }
  if (status === 'PAUSED') {
    return 'Pausado';
  }
  if (status === 'STOPPED') {
    return 'Detenido';
  }
  return 'Sin iniciar';
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

