'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createPropertiesStore(initial) {
  const map = Object.assign({}, initial || {});
  return {
    map,
    getProperty(key) {
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
    },
    setProperty(key, value) {
      map[key] = String(value);
    },
    deleteProperty(key) {
      delete map[key];
    }
  };
}

function makeFakeDate(initialNow) {
  let nowMs = initialNow;
  const RealDate = Date;

  function FakeDate() {
    if (!(this instanceof FakeDate)) {
      return new RealDate(nowMs).toString();
    }
    if (arguments.length === 0) {
      return new RealDate(nowMs);
    }
    return new RealDate(...arguments);
  }

  FakeDate.now = () => nowMs;
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;
  FakeDate.prototype = RealDate.prototype;
  FakeDate.setNow = (ms) => {
    nowMs = ms;
  };

  return FakeDate;
}

function makeUtilitiesStub() {
  function formatDateStub(dateValue, timeZone, pattern) {
    if (!dateValue) {
      return '';
    }
    const d = new Date(dateValue.getTime());
    const values = {
      yyyy: String(d.getUTCFullYear()).padStart(4, '0'),
      MM: String(d.getUTCMonth() + 1).padStart(2, '0'),
      dd: String(d.getUTCDate()).padStart(2, '0'),
      HH: String(d.getUTCHours()).padStart(2, '0'),
      mm: String(d.getUTCMinutes()).padStart(2, '0'),
      ss: String(d.getUTCSeconds()).padStart(2, '0')
    };
    return String(pattern).replace(/yyyy|MM|dd|HH|mm|ss/g, (match) => values[match] || match);
  }

  return {
    formatDate: formatDateStub
  };
}

function chainable() {
  const raw = {};
  const navMethods = ['pushCard', 'popCard', 'popToRoot', 'updateCard'];
  const proxy = new Proxy(raw, {
    get(target, prop) {
      if (prop === 'build') {
        return () => {
          const collectNav = () => {
            const nav = (raw.__nav || []).concat();
            if (raw.__navigation && raw.__navigation.__nav) {
              for (let i = 0; i < raw.__navigation.__nav.length; i++) {
                nav.push(raw.__navigation.__nav[i].slice());
              }
            }
            return nav;
          };
          return {
            type: 'built',
            __notification: raw.__notification,
            __text: raw.__text,
            __params: raw.__params,
            __nav: collectNav()
          };
        };
      }
      if (prop === '__notification' || prop === '__text' || prop === '__params' || prop === '__nav') {
        return raw[prop];
      }
      if (typeof prop !== 'string') {
        return undefined;
      }
      return (...args) => {
        if (navMethods.indexOf(prop) !== -1) {
          raw.__nav = raw.__nav || [];
          raw.__nav.push([prop].concat(args));
        }
        if (prop === 'setText') {
          raw.__text = args[0];
        }
        if (prop === 'setParameters') {
          raw.__params = args[0];
        }
        if (prop === 'setNotification') {
          raw.__notification = args[0];
        }
        if (prop === 'setNavigation') {
          raw.__navigation = args[0];
        }
        return proxy;
      };
    }
  });
  return proxy;
}

function makeCardServiceStub() {
  const CardService = {};
  const builders = [
    'newCardBuilder',
    'newCardHeader',
    'newCardSection',
    'newDecoratedText',
    'newTextInput',
    'newSwitch',
    'newSelectionInput',
    'newButtonSet',
    'newImageButton',
    'newTextButton',
    'newAction',
    'newActionResponseBuilder',
    'newNavigation',
    'newNotification',
    'newOpenLink',
    'newIconImage',
    'newFixedFooter'
  ];

  builders.forEach((name) => {
    CardService[name] = () => chainable();
  });

  CardService.Icon = {
    CLOCK: 'CLOCK',
    VIDEO_PLAY: 'VIDEO_PLAY'
  };
  CardService.SelectionInputType = {
    DROP_DOWN: 'DROP_DOWN'
  };
  CardService.OpenAs = {
    FULL_SIZE: 'FULL_SIZE'
  };
  CardService.OnClose = {
    NOTHING: 'NOTHING'
  };

  return CardService;
}

function makeCalendarStub() {
  const throwNotStubbed = () => {
    throw new Error('Calendar service not stubbed');
  };
  return {
    Events: {
      get: throwNotStubbed,
      list: throwNotStubbed,
      instances: throwNotStubbed,
      patch: throwNotStubbed
    },
    CalendarList: {
      list: throwNotStubbed
    }
  };
}

function makeSpreadsheetAppStub() {
  return {
    create() {
      return {
        getId: () => 'NEW_SPREADSHEET_ID',
        getUrl: () => 'https://docs.google.com/spreadsheets/d/NEW_SPREADSHEET_ID/edit'
      };
    },
    openById() {
      return null;
    }
  };
}

function makeSheetStub(name) {
  const state = { name, values: [], lastRow: 0 };
  return {
    state,
    getName: () => state.name,
    getLastRow: () => state.lastRow,
    appendRow(values) {
      state.values.push(values);
      state.lastRow = state.values.length;
    },
    getRange(row, col, numRows, numCols) {
      return {
        setValues(rows) {
          for (let i = 0; i < rows.length; i++) {
            state.values[row - 1 + i] = rows[i];
          }
          state.lastRow = Math.max(state.lastRow, row + rows.length - 1);
        },
        setFontWeight() {},
        setValue() {}
      };
    },
    setFrozenRows() {},
    clear() {
      state.values = [];
      state.lastRow = 0;
    }
  };
}

function makeRichSpreadsheetStub() {
  const sheets = {
    ChronoCal: makeSheetStub('ChronoCal')
  };
  const spreadsheet = {
    sheets,
    getUrl: () => 'https://docs.google.com/spreadsheets/d/SHEET_ID/edit',
    getId: () => 'SHEET_ID',
    getSheetByName(name) {
      return sheets[name] || null;
    },
    insertSheet(name) {
      const sheet = makeSheetStub(name);
      sheets[name] = sheet;
      return sheet;
    }
  };
  return {
    spreadsheet,
    sheets,
    create() {
      return spreadsheet;
    },
    openById() {
      return spreadsheet;
    }
  };
}

function loadSource(options) {
  const opts = options || {};
  const store = opts.store || createPropertiesStore();

  const sandbox = {
    console,
    Date: makeFakeDate(opts.now != null ? opts.now : Date.now()),
    PropertiesService: {
      getUserProperties: () => store
    },
    Session: {
      getScriptTimeZone: () => 'Etc/UTC'
    },
    Utilities: makeUtilitiesStub(),
    CardService: makeCardServiceStub(),
    Calendar: makeCalendarStub(),
    SpreadsheetApp: makeSpreadsheetAppStub()
  };

  const context = vm.createContext(sandbox);
  const srcDir = path.join(__dirname, '..', '..', 'src');

  for (const file of fs.readdirSync(srcDir).sort()) {
    if (!file.endsWith('.gs')) {
      continue;
    }
    const code = fs.readFileSync(path.join(srcDir, file), 'utf8');
    vm.runInContext(code, context, { filename: file });
  }

  return {
    ctx: context,
    store,
    setNow: (ms) => {
      context.Date.setNow(ms);
    }
  };
}

module.exports = {
  loadSource,
  createPropertiesStore,
  makeRichSpreadsheetStub
};