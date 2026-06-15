function buildBaseCard_(options) {
  var eventContext = options.eventContext || null;
  var activeSession = options.activeSession || null;
  var lastResult = options.lastResult || null;
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
    var isSameActive = activeSession && isSameEvent_(activeSession, eventContext);
    var hasPendingResult = Boolean(lastResult);
    var hasActiveInOtherEvent = activeSession && !isSameActive;
    var activeSessionContext = activeSession ? buildEventContextFromSession_(activeSession) : null;
    var pendingResultContext = lastResult ? buildEventContextFromResult_(lastResult) : eventContext;
    var statusSection = CardService.newCardSection().setHeader('Estado de la sesión');
    var statusText = 'Sin iniciar';
    var elapsedText = '—';

    if (isSameActive) {
      statusText = activeSession.status === 'PAUSED' ? 'Pausado' : 'Activo';
      if (activeSession.status === 'RUNNING') {
        elapsedText = formatDuration_(calculateSessionDurationMs_(activeSession));
      } else if (activeSession.status === 'PAUSED') {
        elapsedText = formatDuration_(calculateSessionDurationMs_(activeSession));
      }
    } else if (hasPendingResult && lastResult.event_id === eventContext.eventId && lastResult.calendar_id === eventContext.calendarId) {
      statusText = 'Detenido (pendiente de guardar)';
      elapsedText = formatDuration_(Number(lastResult.duration_ms || 0));
    }

    statusSection.addWidget(CardService.newDecoratedText().setTopLabel('Evento').setText(eventContext.eventTitle));
    if (isUntitledEvent_(eventContext.eventTitle)) {
      statusSection.addWidget(CardService.newDecoratedText().setTopLabel('ID del evento').setText(eventContext.eventId));
    }
    statusSection.addWidget(CardService.newDecoratedText().setTopLabel('Estado').setText(statusText));
    statusSection.addWidget(CardService.newDecoratedText().setTopLabel('Tiempo transcurrido').setText(elapsedText));
    cardBuilder.addSection(statusSection);

    var actionSection = CardService.newCardSection().setHeader('Acciones');
    var buttonSet = CardService.newButtonSet();

    if (isSameActive && activeSession.status === 'RUNNING') {
      buttonSet.addButton(createPrimaryPauseButton_(eventContext));
      buttonSet.addButton(createPrimaryStopButton_(eventContext));
      buttonSet.addButton(createSecondaryButton_('Refrescar', 'onRefreshCard', eventContext, CardService.TextButtonStyle.OUTLINED));
    } else if (isSameActive && activeSession.status === 'PAUSED') {
      buttonSet.addButton(createPrimaryResumeButton_(eventContext));
      buttonSet.addButton(createPrimaryStopButton_(eventContext));
      buttonSet.addButton(createSecondaryButton_('Refrescar', 'onRefreshCard', eventContext, CardService.TextButtonStyle.OUTLINED));
    } else {
      buttonSet.addButton(createPrimaryStartButton_(eventContext));
      buttonSet.addButton(createSecondaryButton_('Refrescar', 'onRefreshCard', eventContext, CardService.TextButtonStyle.OUTLINED));
    }

    actionSection.addWidget(buttonSet);
    cardBuilder.addSection(actionSection);

    if (hasActiveInOtherEvent && activeSessionContext) {
      var globalSessionSection = CardService.newCardSection().setHeader('Sesión activa en otro evento');
      var globalButtons = CardService.newButtonSet();

      globalSessionSection.addWidget(
        CardService.newDecoratedText()
          .setTopLabel('Evento activo')
          .setText(activeSession.event_title || activeSessionContext.eventTitle || 'Evento sin título')
      );
      globalSessionSection.addWidget(
        CardService.newDecoratedText()
          .setTopLabel('Tiempo acumulado')
          .setText(formatDuration_(calculateSessionDurationMs_(activeSession)))
      );

      if (activeSession.status === 'RUNNING') {
        globalButtons.addButton(createPrimaryPauseButton_(activeSessionContext));
      } else if (activeSession.status === 'PAUSED') {
        globalButtons.addButton(createPrimaryResumeButton_(activeSessionContext));
      }
      globalButtons.addButton(createPrimaryStopButton_(activeSessionContext));
      globalSessionSection.addWidget(globalButtons);
      cardBuilder.addSection(globalSessionSection);
    }

    if (hasPendingResult) {
      var pendingSection = CardService.newCardSection().setHeader('Resultado pendiente');
      var pendingButtons = CardService.newButtonSet();

      pendingSection.addWidget(
        CardService.newDecoratedText()
          .setTopLabel('Duración lista para guardar')
          .setText(formatDuration_(Number(lastResult.duration_ms || 0)))
      );
      pendingSection.addWidget(
        CardService.newDecoratedText()
          .setTopLabel('Evento del resultado')
          .setText(lastResult.event_title || 'Evento sin título')
      );

      pendingButtons.addButton(createPrimarySaveButton_(pendingResultContext));
      pendingButtons.addButton(createSecondaryButton_('Descartar', 'onDiscardLastResult', pendingResultContext, CardService.TextButtonStyle.OUTLINED));
      pendingSection.addWidget(pendingButtons);
      pendingSection.addWidget(
        CardService.newTextParagraph().setText('Guardar en evento es una acción separada para no mezclar tracking y escritura de Calendar.')
      );
      cardBuilder.addSection(pendingSection);
    }
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
    .setText('Detener')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#d93025')
    .setOnClickAction(buildCardAction_('onStopTracking', eventContext));
}

function createPrimaryPauseButton_(eventContext) {
  return CardService.newTextButton()
    .setText('Pausar')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#f9ab00')
    .setOnClickAction(buildCardAction_('onPauseTracking', eventContext));
}

function createPrimaryResumeButton_(eventContext) {
  return CardService.newTextButton()
    .setText('Reanudar')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#1e8e3e')
    .setOnClickAction(buildCardAction_('onResumeTracking', eventContext));
}

function createPrimarySaveButton_(eventContext) {
  return CardService.newTextButton()
    .setText('Guardar en evento')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#1a73e8')
    .setOnClickAction(buildCardAction_('onSaveLastResultToEvent', eventContext));
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
