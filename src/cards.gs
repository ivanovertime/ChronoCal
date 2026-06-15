function buildBaseCard_(options) {
  var eventContext = options.eventContext || null;
  var activeSession = options.activeSession || null;
  var cardBuilder = CardService.newCardBuilder();
  var header = CardService.newCardHeader().setTitle('ChronoCal');

  if (eventContext && eventContext.eventTitle) {
    header.setSubtitle(eventContext.eventTitle);
  } else {
    header.setSubtitle('Tracking local de tiempo para Google Calendar');
  }

  cardBuilder.setHeader(header);

  var introSection = CardService.newCardSection();
  introSection.addWidget(
    CardService.newTextParagraph().setText(
      eventContext
        ? 'Registra tiempo directamente sobre este evento. El estado se guarda en tu cuenta de Google.'
        : 'Abre un evento de Google Calendar para iniciar o revisar un registro de tiempo.'
    )
  );
  cardBuilder.addSection(introSection);

  if (eventContext) {
    var statusSection = CardService.newCardSection().setHeader('Estado de la sesión');
    var statusText = 'Sin iniciar';
    var elapsedText = '—';

    if (activeSession && isSameEvent_(activeSession, eventContext)) {
      statusText = activeSession.status === 'PAUSED' ? 'Pausado' : 'Activo';
      if (activeSession.status === 'RUNNING') {
        elapsedText = formatDuration_(Date.now() - Number(activeSession.started_at_ms || Date.now()));
      } else if (activeSession.status === 'PAUSED') {
        elapsedText = formatDuration_(Number(activeSession.elapsed_ms || 0));
      }
    }

    statusSection.addWidget(CardService.newDecoratedText().setTopLabel('Evento').setText(eventContext.eventTitle));
    statusSection.addWidget(CardService.newDecoratedText().setTopLabel('Estado').setText(statusText));
    statusSection.addWidget(CardService.newDecoratedText().setTopLabel('Tiempo transcurrido').setText(elapsedText));
    cardBuilder.addSection(statusSection);

    var actionSection = CardService.newCardSection().setHeader('Acciones');
    var buttonSet = CardService.newButtonSet();

    if (activeSession && isSameEvent_(activeSession, eventContext) && activeSession.status === 'RUNNING') {
      buttonSet.addButton(createPrimaryStopButton_(eventContext));
      buttonSet.addButton(createSecondaryButton_('Refrescar', 'onRefreshCard', eventContext, CardService.TextButtonStyle.OUTLINED));
    } else {
      buttonSet.addButton(createPrimaryStartButton_(eventContext));
      buttonSet.addButton(createSecondaryButton_('Refrescar', 'onRefreshCard', eventContext, CardService.TextButtonStyle.OUTLINED));
    }

    actionSection.addWidget(buttonSet);
    cardBuilder.addSection(actionSection);
  }

  var footerSection = CardService.newCardSection();
  footerSection.addWidget(
    CardService.newTextParagraph().setText(
      'MVP: CardService sin reloj en vivo. El tiempo se recalcula al pulsar acciones.'
    )
  );
  cardBuilder.addSection(footerSection);

  return cardBuilder.build();
}

function createPrimaryStartButton_(eventContext) {
  return CardService.newTextButton()
    .setText('Iniciar registro')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#1e8e3e')
    .setOnClickAction(buildCardAction_('onStartTracking', eventContext));
}

function createPrimaryStopButton_(eventContext) {
  return CardService.newTextButton()
    .setText('Detener y guardar')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#d93025')
    .setOnClickAction(buildCardAction_('onStopTracking', eventContext));
}

function createSecondaryButton_(label, functionName, eventContext, style) {
  return CardService.newTextButton()
    .setText(label)
    .setTextButtonStyle(style || CardService.TextButtonStyle.OUTLINED)
    .setOnClickAction(buildCardAction_(functionName, eventContext));
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
