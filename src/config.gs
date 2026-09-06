var CHRONOCAL_CONFIG = {
  sessionPropertyKey: 'CHRONOCAL_ACTIVE_SESSION',
  sessionsPropertyKey: 'CHRONOCAL_SESSIONS',
  lastResultPropertyKey: 'CHRONOCAL_LAST_RESULT',
  eventMetaCachePropertyKey: 'CHRONOCAL_EVENT_META_CACHE',
  settingsPropertyKey: 'CHRONOCAL_SETTINGS',
  descriptionTag: '⌛ Duración Real:',
  defaultSheetName: 'ChronoCal',
  summarySheetName: 'ChronoCal Summary',
  stopModes: ['DESCRIPTION', 'END_TIME', 'BOTH'],
  defaultStopMode: 'DESCRIPTION',
  defaultLocale: 'es',
  maxEventMetaCacheEntries: 30,
  maxSessions: 25
};

function getDefaultSettings_() {
  return {
    stopMode: CHRONOCAL_CONFIG.defaultStopMode,
    writeDescription: true,
    sheetsExportEnabled: false,
    sheetsSpreadsheetId: '',
    sheetsSpreadsheetUrl: '',
    sheetsSheetName: CHRONOCAL_CONFIG.defaultSheetName,
    userLocale: CHRONOCAL_CONFIG.defaultLocale,
    localeSource: 'auto'
  };
}

function normalizeSettings_(settings) {
  var defaults = getDefaultSettings_();
  var source = settings || {};
  var locale = getSupportedLocale_(source.userLocale) || defaults.userLocale;
  var localeSource = source.localeSource === 'manual' ? 'manual' : 'auto';
  var stopMode = defaults.stopMode;
  if (CHRONOCAL_CONFIG.stopModes && CHRONOCAL_CONFIG.stopModes.indexOf(source.stopMode) !== -1) {
    stopMode = source.stopMode;
  }

  return {
    stopMode: stopMode,
    writeDescription: source.writeDescription !== false,
    sheetsExportEnabled: source.sheetsExportEnabled === true,
    sheetsSpreadsheetId: source.sheetsSpreadsheetId || '',
    sheetsSpreadsheetUrl: source.sheetsSpreadsheetUrl || '',
    sheetsSheetName: source.sheetsSheetName || defaults.sheetsSheetName,
    userLocale: locale,
    localeSource: localeSource
  };
}
