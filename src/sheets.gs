var CHRONOCAL_SHEET_HEADERS = [
  'Exportado',
  'Evento',
  'Calendario',
  'Estado',
  'Duración',
  'Duración (min)',
  'Inicio',
  'Fin'
];

function getOrCreateExportSpreadsheet_(settings) {
  var spreadsheet = null;

  if (settings.sheetsSpreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(settings.sheetsSpreadsheetId);
    } catch (error) {
      spreadsheet = null;
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('ChronoCal · Registro de tiempo');
    settings.sheetsSpreadsheetId = spreadsheet.getId();
    settings.sheetsSpreadsheetUrl = spreadsheet.getUrl();
    saveSettings_(settings);
  }

  return spreadsheet;
}

function getOrCreateExportSheet_(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CHRONOCAL_SHEET_HEADERS);
    sheet.getRange(1, 1, 1, CHRONOCAL_SHEET_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function buildSessionExportRow_(session, exportedAtIso) {
  var durationMs = calculateSessionDurationMs_(session);
  var startIso = session.started_at_iso || '';
  var endIso = session.status === 'STOPPED'
    ? (session.stopped_at_iso || '')
    : new Date().toISOString();

  return [
    exportedAtIso,
    session.event_title || 'Evento sin título',
    session.calendar_id || 'primary',
    statusLabel_(session.status),
    formatDuration_(durationMs),
    Math.round(durationMs / 60000),
    startIso,
    endIso
  ];
}

function exportSessionsToSheets_(sessionsToExport) {
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
  var spreadsheet = getOrCreateExportSpreadsheet_(settings);
  var sheet = getOrCreateExportSheet_(spreadsheet, settings.sheetsSheetName);
  var exportedAtIso = new Date().toISOString();

  var rows = list.map(function(session) {
    return buildSessionExportRow_(session, exportedAtIso);
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, CHRONOCAL_SHEET_HEADERS.length).setValues(rows);

  return {
    count: rows.length,
    url: settings.sheetsSpreadsheetUrl || spreadsheet.getUrl()
  };
}
