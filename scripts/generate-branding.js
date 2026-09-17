'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.resolve(__dirname, '../assets');

// Base path definitions
const PATH_TOP_LINE = 'M32.906 37.74H13.533c-1.99 0-3.71 1.63-3.71 3.71s1.63 3.71 3.71 3.71h19.373c1.99 0 3.71-1.63 3.71-3.71s-1.72-3.71-3.71-3.71';
const PATH_MID_LINE = 'M29.921 59.453c1.99 0 3.71-1.629 3.71-3.71 0-1.99-1.63-3.708-3.71-3.708H6.209c-1.99 0-3.709 1.628-3.709 3.709 0 1.99 1.628 3.709 3.71 3.709z';
const PATH_BOT_LINE = 'M32.906 66.419H18.07c-1.99 0-3.71 1.628-3.71 3.709s1.63 3.71 3.71 3.71h14.836c1.99 0 3.71-1.63 3.71-3.71s-1.72-3.71-3.71-3.71';
const PATH_BODY_RING = 'M68.189 23.085V21.25a2.415 2.415 0 0 1 2.414-2.415h1.838c2.078 0 3.86-1.776 3.698-3.988-.143-1.965-1.894-3.43-3.864-3.43H56.609c-2.079 0-3.861 1.776-3.7 3.988.145 1.965 1.895 3.43 3.866 3.43h1.67a2.415 2.415 0 0 1 2.416 2.415v1.835c-7.147.814-13.842 3.89-18.998 8.866-1.448 1.447-1.538 3.709-.09 5.156 1.447 1.448 3.708 1.538 5.156.09 4.704-4.522 11.037-7.055 17.641-7.055 15.422 0 27.711 13.72 25.298 29.472-1.646 10.751-10.12 19.41-20.838 21.258-8.208 1.414-16.237-1.14-22.101-6.673-1.448-1.357-3.8-1.357-5.157.09s-1.357 3.8.09 5.157c6.152 5.88 14.204 9.137 22.708 9.137 18.184 0 32.93-14.746 32.93-32.93-.09-16.827-12.937-30.759-29.311-32.568';
const PATH_HANDS = 'M64.48 37.74c-1.99 0-3.71 1.63-3.71 3.71v14.294c0 1.99 1.629 3.709 3.71 3.709h12.213c1.99 0 3.709-1.629 3.709-3.71 0-1.99-1.629-3.708-3.71-3.708H68.19V41.45c0-2.08-1.72-3.71-3.71-3.71';

/**
 * MASTER POLISHED STORE ICON (128x128)
 * - Dual-Color Gradient: Electric Cyan (#00E5FF) to Google Royal Blue (#1A73E8 -> #1557BF)
 * - Solid white dial fill with subtle tick marks
 * - Optically centered: translate(17.4, 19.3) scale(0.90)
 * - Hands in deep Google blue with high-contrast accent pin
 * - Google Material elevated white squircle tile
 */
function generateMasterStoreIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <!-- Multi-tier Google elevation drop shadow -->
    <filter id="tileShadowMaster" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#1A73E8" flood-opacity="0.16"/>
      <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#3C4043" flood-opacity="0.08"/>
    </filter>

    <!-- Master Dual Gradient (Electric Cyan -> Sky -> Google Blue -> Deep Blue) -->
    <linearGradient id="masterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="35%" stop-color="#00B4FF"/>
      <stop offset="75%" stop-color="#1A73E8"/>
      <stop offset="100%" stop-color="#1255B8"/>
    </linearGradient>

    <!-- Horizontal speed line gradient -->
    <linearGradient id="masterLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#30E3FF"/>
      <stop offset="100%" stop-color="#1A73E8"/>
    </linearGradient>

    <!-- Clock hands gradient (Deep Navy to Google Blue) -->
    <linearGradient id="handsMasterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A73E8"/>
      <stop offset="100%" stop-color="#0D47A1"/>
    </linearGradient>
  </defs>

  <!-- Google Workspace White Squircle Tile -->
  <rect x="7" y="7" width="114" height="114" rx="28" fill="#FFFFFF" filter="url(#tileShadowMaster)"/>
  <rect x="7.5" y="7.5" width="113" height="113" rx="27.5" fill="none" stroke="#E8EEF5" stroke-width="1"/>

  <!-- Optically Centered Glyph (center of bounding box at 64, 64) -->
  <g transform="translate(17.4, 19.3) scale(0.90)">
    <!-- Crisp White Dial Fill inside Stopwatch -->
    <circle cx="64.5" cy="52.5" r="26.2" fill="#FFFFFF"/>

    <!-- Subtle Chronometer Hour Ticks (12, 3, 6, 9) -->
    <line x1="64.5" y1="29.0" x2="64.5" y2="33.0" stroke="#E2E7ED" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="64.5" y1="72.0" x2="64.5" y2="76.0" stroke="#E2E7ED" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="41.0" y1="52.5" x2="45.0" y2="52.5" stroke="#E2E7ED" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="84.0" y1="52.5" x2="88.0" y2="52.5" stroke="#E2E7ED" stroke-width="1.8" stroke-linecap="round"/>

    <!-- Speed / Calendar Motion Lines -->
    <path fill="url(#masterLineGrad)" d="${PATH_TOP_LINE}" opacity="0.90" />
    <path fill="url(#masterLineGrad)" d="${PATH_MID_LINE}" />
    <path fill="url(#masterLineGrad)" d="${PATH_BOT_LINE}" opacity="0.90" />

    <!-- Stopwatch Outer Ring & Top Crown -->
    <path fill="url(#masterGrad)" d="${PATH_BODY_RING}" />

    <!-- Clock Hands (Deep Google Navy/Blue) -->
    <path fill="url(#handsMasterGrad)" d="${PATH_HANDS}" />

    <!-- High-Contrast Dual-Ring Center Pin -->
    <circle cx="64.5" cy="55.7" r="3.2" fill="#FFFFFF"/>
    <circle cx="64.5" cy="55.7" r="2.0" fill="#00D4FF"/>
  </g>
</svg>`;
}

/**
 * MASTER COMPANION BAR ICON (32x32 transparent PNG / SVG)
 * - Designed specifically for Google Calendar companion sidebar
 * - White inner dial ensures readability against any calendar background
 */
function generateMasterCompanionSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="compMasterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00D4FF"/>
      <stop offset="100%" stop-color="#1A73E8"/>
    </linearGradient>
  </defs>

  <!-- Optically centered in 32x32 canvas -->
  <g transform="translate(1.4, 2.0) scale(0.31)">
    <!-- White inner dial so it pops on dark/light side panels -->
    <circle cx="64.5" cy="52.5" r="26.2" fill="#FFFFFF"/>

    <!-- Speed bars -->
    <path fill="url(#compMasterGrad)" d="${PATH_TOP_LINE}" />
    <path fill="url(#compMasterGrad)" d="${PATH_MID_LINE}" />
    <path fill="url(#compMasterGrad)" d="${PATH_BOT_LINE}" />

    <!-- Stopwatch Outer Ring & Top Crown -->
    <path fill="url(#compMasterGrad)" d="${PATH_BODY_RING}" />

    <!-- Hands in deep Google Blue -->
    <path fill="#0D47A1" d="${PATH_HANDS}" />

    <!-- Center pin -->
    <circle cx="64.5" cy="55.7" r="3.2" fill="#FFFFFF"/>
    <circle cx="64.5" cy="55.7" r="2.0" fill="#00D4FF"/>
  </g>
</svg>`;
}

/**
 * MASTER MARKETPLACE STORE BANNER (440x280)
 */
function generateMasterPromoBannerSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 280" width="440" height="280">
  <defs>
    <linearGradient id="bgBannerMaster" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#F8FAFD"/>
      <stop offset="100%" stop-color="#EDF4FD"/>
    </linearGradient>

    <linearGradient id="accentStripe" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="40%" stop-color="#00B0FF"/>
      <stop offset="100%" stop-color="#1A73E8"/>
    </linearGradient>

    <filter id="tileBannerShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#1A73E8" flood-opacity="0.18"/>
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#00D4FF" flood-opacity="0.12"/>
    </filter>

    <linearGradient id="ringBannerMaster" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="35%" stop-color="#00B4FF"/>
      <stop offset="70%" stop-color="#1A73E8"/>
      <stop offset="100%" stop-color="#1255B8"/>
    </linearGradient>

    <linearGradient id="barBannerMaster" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#30E3FF"/>
      <stop offset="100%" stop-color="#1A73E8"/>
    </linearGradient>
  </defs>

  <!-- Background Card -->
  <rect width="440" height="280" rx="16" fill="url(#bgBannerMaster)"/>
  <rect x="0.5" y="0.5" width="439" height="279" rx="15.5" fill="none" stroke="#DDE3EA" stroke-width="1"/>

  <!-- Left Side: Elevated App Icon Tile -->
  <g transform="translate(36, 44)">
    <rect width="114" height="114" rx="28" fill="#FFFFFF" filter="url(#tileBannerShadow)"/>
    <rect width="114" height="114" rx="28" fill="none" stroke="#E8F0FE" stroke-width="1.5"/>

    <!-- Optically Centered Icon inside tile -->
    <g transform="translate(10.5, 12.5) scale(0.90)">
      <circle cx="64.5" cy="52.5" r="26.2" fill="#FFFFFF"/>
      <line x1="64.5" y1="29.0" x2="64.5" y2="33.0" stroke="#E2E7ED" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="64.5" y1="72.0" x2="64.5" y2="76.0" stroke="#E2E7ED" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="41.0" y1="52.5" x2="45.0" y2="52.5" stroke="#E2E7ED" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="84.0" y1="52.5" x2="88.0" y2="52.5" stroke="#E2E7ED" stroke-width="1.8" stroke-linecap="round"/>

      <path fill="url(#barBannerMaster)" d="${PATH_TOP_LINE}" opacity="0.90" />
      <path fill="url(#barBannerMaster)" d="${PATH_MID_LINE}" />
      <path fill="url(#barBannerMaster)" d="${PATH_BOT_LINE}" opacity="0.90" />

      <path fill="url(#ringBannerMaster)" d="${PATH_BODY_RING}" />
      <path fill="#0D47A1" d="${PATH_HANDS}" />

      <circle cx="64.5" cy="55.7" r="3.2" fill="#FFFFFF"/>
      <circle cx="64.5" cy="55.7" r="2.0" fill="#00D4FF"/>
    </g>
  </g>

  <!-- Right Side: Clean Typography & Feature Badges -->
  <g transform="translate(172, 42)">
    <!-- App Name -->
    <text x="0" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#1A73E8" letter-spacing="-0.6">ChronoCal</text>

    <!-- Tagline -->
    <text x="0" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="500" fill="#3C4043">Local Time Tracker for Google Calendar</text>

    <!-- Feature Badges -->
    <g transform="translate(0, 84)">
      <!-- Badge 1: 100% Native & Private -->
      <rect x="0" y="0" width="186" height="24" rx="12" fill="#E8F0FE"/>
      <text x="12" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#1A73E8">🔒 100% Native &amp; Private</text>

      <!-- Badge 2: Zero External Servers -->
      <rect x="0" y="30" width="186" height="24" rx="12" fill="#E6F8FB"/>
      <text x="12" y="46" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#007F9E">⚡ Zero External Servers</text>

      <!-- Badge 3: Sheets Export & Sync -->
      <rect x="0" y="60" width="186" height="24" rx="12" fill="#F1F3F4"/>
      <text x="12" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#3C4043">📊 Google Sheets Export</text>
    </g>
  </g>

  <!-- Bottom Accent Stripe -->
  <rect x="0" y="274" width="440" height="6" fill="url(#accentStripe)"/>
</svg>`;
}

// Generate files
const files = [
  { name: 'icon-128.svg', content: generateMasterStoreIconSvg() },
  { name: 'icon-32.svg', content: generateMasterCompanionSvg() },
  { name: 'promo-card-440x280.svg', content: generateMasterPromoBannerSvg() }
];

files.forEach(({ name, content }) => {
  const filePath = path.join(ASSETS_DIR, name);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Wrote SVG: ${filePath}`);
});

// Render PNGs using Inkscape
function renderPng(svgName, pngName, width, height) {
  const svgPath = path.join(ASSETS_DIR, svgName);
  const pngPath = path.join(ASSETS_DIR, pngName);
  try {
    execSync(`inkscape "${svgPath}" --export-filename="${pngPath}" -w ${width} -h ${height}`, { stdio: 'pipe' });
    console.log(`Rendered PNG: ${pngPath} (${width}x${height})`);
  } catch (err) {
    console.error(`Error rendering ${pngName}:`, err.message);
  }
}

// Render 128x128 store icon and 512x512 high-res master
renderPng('icon-128.svg', 'icon-128.png', 128, 128);
renderPng('icon-128.svg', 'icon-512.png', 512, 512);

// Render 32x32 companion bar icon & update active icon.png
renderPng('icon-32.svg', 'icon-32.png', 32, 32);
renderPng('icon-32.svg', 'icon.png', 32, 32);

// Render 440x280 Marketplace store promo card
renderPng('promo-card-440x280.svg', 'promo-card-440x280.png', 440, 280);

console.log('Done generating clean master branding assets!');
