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
    sheetsSpreadsheetId: '',
    sheetsSheetName: CHRONOCAL_CONFIG.defaultSheetName
  };
}
