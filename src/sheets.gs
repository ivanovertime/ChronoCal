function createExportSpreadsheet_(settings, locale) {
  var spreadsheet = SpreadsheetApp.create(t_('sheet.spreadsheetTitle', null, locale));
  settings.sheetsSpreadsheetId = spreadsheet.getId();
  settings.sheetsSpreadsheetUrl = spreadsheet.getUrl();
  saveSettings_(settings);
  return spreadsheet;
}

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
    spreadsheet = createExportSpreadsheet_(settings, locale);
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
  buildSummarySheet_(spreadsheet, list, activeLocale);

  return {
    count: rows.length,
    url: settings.sheetsSpreadsheetUrl || spreadsheet.getUrl()
  };
}

function getOrCreateSummarySheet_(spreadsheet, locale) {
  var sheetName = CHRONOCAL_CONFIG.summarySheetName;
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

function buildSummarySheet_(spreadsheet, sessions, locale) {
  var activeLocale = getSupportedLocale_(locale) || CHRONOCAL_CONFIG.defaultLocale;
  var sheet = getOrCreateSummarySheet_(spreadsheet, activeLocale);
  var rows = buildSummaryRows_(sessions || [], activeLocale);

  sheet.clear();
  var cursor = 1;

  sheet.getRange(cursor, 1, rows.length, 5).setValues(rows);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function buildSummaryRows_(sessions, locale) {
  var headers = getSummaryHeaders_(locale);
  var byDate = {};
  var byEvent = {};
  var list = (sessions || []).filter(function(session) {
    return Boolean(session);
  });

  for (var i = 0; i < list.length; i++) {
    var session = list[i];
    var durationMs = calculateSessionDurationMs_(session);
    var timeZone = session.time_zone || Session.getScriptTimeZone();
    var startIso = session.started_at_iso || '';
    var startMs = Date.parse(startIso);
    var dateKey = '';

    if (!isNaN(startMs)) {
      dateKey = formatDateKey_(new Date(startMs), timeZone);
    } else {
      dateKey = t_('sheet.exported', null, locale);
    }

    var eventKey = session.event_title || t_('common.untitledEvent', null, locale);

    byDate[dateKey] = byDate[dateKey] || { count: 0, ms: 0 };
    byDate[dateKey].count += 1;
    byDate[dateKey].ms += durationMs;

    byEvent[eventKey] = byEvent[eventKey] || { count: 0, ms: 0, calendarId: session.calendar_id || 'primary' };
    byEvent[eventKey].count += 1;
    byEvent[eventKey].ms += durationMs;
  }

  var rows = [headers];

  var dateKeys = Object.keys(byDate).sort(function(a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
  });
  for (var j = 0; j < dateKeys.length; j++) {
    var dateRow = byDate[dateKeys[j]];
    rows.push([
      dateKeys[j],
      '',
      dateRow.count,
      formatDuration_(dateRow.ms),
      Math.round(dateRow.ms / 60000)
    ]);
  }

  var eventKeys = Object.keys(byEvent).sort(function(a, b) {
    return byEvent[b].ms - byEvent[a].ms;
  });
  for (var k = 0; k < eventKeys.length; k++) {
    var eventRow = byEvent[eventKeys[k]];
    rows.push([
      '',
      eventKeys[k],
      eventRow.count,
      formatDuration_(eventRow.ms),
      Math.round(eventRow.ms / 60000)
    ]);
  }

  return rows;
}
