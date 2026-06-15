function buildBaseCard_(options) {
  var eventContext = options.eventContext || null;
  var sessions = options.sessions || [];
  var entries = buildTrackingEntries_(eventContext, sessions);
  var activeCount = countActiveSessions_(sessions);

  var cardBuilder = CardService.newCardBuilder();
  var header = CardService.newCardHeader().setTitle('ChronoCal');
  header.setSubtitle(
    activeCount > 0
      ? activeCount + (activeCount === 1 ? ' evento en seguimiento' : ' eventos en seguimiento')
      : 'Seguimiento local de tiempo'
  );
  cardBuilder.setHeader(header);

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
    cardBuilder.addSection(buildEntrySection_(entries[i]));
  }

  cardBuilder.addSection(buildToolbarSection_(entries[0].context));
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

function countActiveSessions_(sessions) {
  var list = sessions || [];
  var count = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].status === 'RUNNING' || list[i].status === 'PAUSED') {
      count++;
    }
  }
  return count;
}

function buildEntrySection_(entry) {
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

  section.addWidget(buildEntryActions_(status, context));

  return section;
}

function buildEntryActions_(status, context) {
  var buttons = CardService.newButtonSet();

  if (status === 'RUNNING') {
    buttons.addButton(createIconButton_('pause', 'Pausar', 'onPauseTracking', context));
    buttons.addButton(createIconButton_('stop', 'Detener', 'onStopTracking', context));
  } else if (status === 'PAUSED') {
    buttons.addButton(createIconButton_('play_arrow', 'Reanudar', 'onResumeTracking', context));
    buttons.addButton(createIconButton_('stop', 'Detener', 'onStopTracking', context));
  } else if (status === 'STOPPED') {
    buttons.addButton(createIconButton_('play_arrow', 'Reanudar', 'onResumeTracking', context));
    buttons.addButton(createIconButton_('save', 'Guardar en el evento', 'onSaveSession', context));
    buttons.addButton(createIconButton_('delete', 'Descartar', 'onDiscardSession', context));
  } else {
    buttons.addButton(createIconButton_('play_arrow', 'Iniciar', 'onStartTracking', context));
  }

  return buttons;
}

function buildToolbarSection_(context) {
  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText('Actualizar tiempos')
        .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
        .setOnClickAction(buildCardAction_('onRefreshCard', context))
    )
  );
  return section;
}

function buildFooterSection_() {
  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newTextParagraph().setText(
      'Los tiempos se recalculan al usar una acción o al pulsar «Actualizar tiempos».'
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

function chronoActionIconUrl_(iconName) {
  return 'https://www.gstatic.com/images/icons/material/system/1x/' + iconName + '_grey600_24dp.png';
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
