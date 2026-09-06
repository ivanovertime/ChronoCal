'use strict';

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((file) => file.endsWith('.gs'));
let failed = false;

for (const file of files) {
  const code = fs.readFileSync(path.join(dir, file), 'utf8');
  try {
    // eslint-disable-next-line no-new-func
    new Function(code);
    console.log('OK:', file);
  } catch (error) {
    failed = true;
    console.error('SYNTAX FAIL:', file, '-', error.message);
  }
}

try {
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'appsscript.json'), 'utf8'));
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.clasp.json'), 'utf8'));
  console.log('OK: manifests');
} catch (error) {
  failed = true;
  console.error('MANIFEST FAIL:', error.message);
}

process.exit(failed ? 1 : 0);