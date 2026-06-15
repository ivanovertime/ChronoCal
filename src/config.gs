var CHRONOCAL_CONFIG = {
  sessionPropertyKey: 'CHRONOCAL_ACTIVE_SESSION',
  sessionsPropertyKey: 'CHRONOCAL_SESSIONS',
  lastResultPropertyKey: 'CHRONOCAL_LAST_RESULT',
  eventMetaCachePropertyKey: 'CHRONOCAL_EVENT_META_CACHE',
  settingsPropertyKey: 'CHRONOCAL_SETTINGS',
  descriptionTag: '⌛ Duración Real:',
  defaultSheetName: 'ChronoCal',
  defaultStopMode: 'DESCRIPTION'
};

function getDefaultSettings_() {
  return {
    stopMode: CHRONOCAL_CONFIG.defaultStopMode,
    writeDescription: true,
    sheetsSpreadsheetId: '',
    sheetsSpreadsheetUrl: '',
    sheetsSheetName: CHRONOCAL_CONFIG.defaultSheetName
  };
}

function normalizeSettings_(settings) {
  var defaults = getDefaultSettings_();
  var source = settings || {};

  return {
    stopMode: source.stopMode || defaults.stopMode,
    writeDescription: source.writeDescription !== false,
    sheetsSpreadsheetId: source.sheetsSpreadsheetId || '',
    sheetsSpreadsheetUrl: source.sheetsSpreadsheetUrl || '',
    sheetsSheetName: source.sheetsSheetName || defaults.sheetsSheetName
  };
}
