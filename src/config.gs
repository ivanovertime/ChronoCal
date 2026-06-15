var CHRONOCAL_CONFIG = {
  sessionPropertyKey: 'CHRONOCAL_ACTIVE_SESSION',
  sessionsPropertyKey: 'CHRONOCAL_SESSIONS',
  lastResultPropertyKey: 'CHRONOCAL_LAST_RESULT',
  eventMetaCachePropertyKey: 'CHRONOCAL_EVENT_META_CACHE',
  settingsPropertyKey: 'CHRONOCAL_SETTINGS',
  docsUrl: 'https://github.com/ivanovertime/ChronoCal/tree/trunk/docs',
  descriptionTag: '⌛ Duración Real:',
  defaultSheetName: 'ChronoCal',
  defaultStopMode: 'DESCRIPTION',
  defaultLocale: 'es'
};

function getDefaultSettings_() {
  return {
    stopMode: CHRONOCAL_CONFIG.defaultStopMode,
    writeDescription: true,
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

  return {
    stopMode: source.stopMode || defaults.stopMode,
    writeDescription: source.writeDescription !== false,
    sheetsSpreadsheetId: source.sheetsSpreadsheetId || '',
    sheetsSpreadsheetUrl: source.sheetsSpreadsheetUrl || '',
    sheetsSheetName: source.sheetsSheetName || defaults.sheetsSheetName,
    userLocale: locale,
    localeSource: localeSource
  };
}
