var CHRONOCAL_CONFIG = {
  sessionPropertyKey: 'CHRONOCAL_ACTIVE_SESSION',
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
