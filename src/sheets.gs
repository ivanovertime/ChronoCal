function getOrCreateExportSpreadsheet_(settings, locale) {
  var spreadsheet = null;

  if (settings.sheetsSpreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(settings.sheetsSpreadsheetId);
    } catch (error) {
      spreadsheet = null;
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(t_('sheet.spreadsheetTitle', null, locale));
    settings.sheetsSpreadsheetId = spreadsheet.getId();
    settings.sheetsSpreadsheetUrl = spreadsheet.getUrl();
    saveSettings_(settings);
  }

  return spreadsheet;
}

function getOrCreateExportSheet_(spreadsheet, sheetName, locale) {
  var headers = getSheetHeaders_(locale);
  var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function buildSessionExportRow_(session, exportedAtIso, locale) {
  var durationMs = calculateSessionDurationMs_(session);
  var startIso = session.started_at_iso || '';
  var endIso = session.status === 'STOPPED'
    ? (session.stopped_at_iso || '')
    : new Date().toISOString();

  return [
    exportedAtIso,
    session.event_title || t_('common.untitledEvent', null, locale),
    session.calendar_id || 'primary',
    statusLabel_(session.status, locale),
    formatDuration_(durationMs),
    Math.round(durationMs / 60000),
    startIso,
    endIso
  ];
}

function exportSessionsToSheets_(sessionsToExport, locale) {
  var activeLocale = getSupportedLocale_(locale) || CHRONOCAL_CONFIG.defaultLocale;
  var list = (sessionsToExport || []).filter(function(session) {
    return Boolean(session);
  });

  if (!list.length) {
    return {
      count: 0,
      url: ''
    };
  }

  var settings = getSettings_();
  var spreadsheet = getOrCreateExportSpreadsheet_(settings, activeLocale);
  var sheet = getOrCreateExportSheet_(spreadsheet, settings.sheetsSheetName, activeLocale);
  var exportedAtIso = new Date().toISOString();
  var headers = getSheetHeaders_(activeLocale);

  var rows = list.map(function(session) {
    return buildSessionExportRow_(session, exportedAtIso, activeLocale);
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);

  return {
    count: rows.length,
    url: settings.sheetsSpreadsheetUrl || spreadsheet.getUrl()
  };
}
