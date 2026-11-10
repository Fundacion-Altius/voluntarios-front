#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');

function extractJsonObject(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return { value: text.slice(start, i + 1), end: i + 1 };
    }
  }
  throw new Error('Unbalanced braces');
}

function formatSections(sections) {
  return JSON.stringify(sections, null, 2)
    .slice(1, -1)
    .split('\n')
    .map((line) => (line ? `    ${line}` : line))
    .join('\n');
}

function fixFile(filename) {
  const filePath = path.join(messagesDir, filename);
  let text = fs.readFileSync(filePath, 'utf8');

  const secondMarker = '\n  "admin": {\n    "automation": {\n      "navLabel"';
  const secondIdx = text.indexOf(secondMarker);
  if (secondIdx === -1) {
    console.log(`${filename}: no duplicate admin block`);
    return;
  }

  const braceStart = text.indexOf('{', secondIdx + '\n  "admin": '.length);
  const { value: secondAdminJson, end: secondAdminEnd } = extractJsonObject(text, braceStart);
  const secondAdmin = JSON.parse(secondAdminJson);
  const navLabel = secondAdmin.automation?.navLabel;
  const { automation: _drop, ...sectionsToMerge } = secondAdmin;

  const commaBeforeSecond = text.lastIndexOf(',', secondIdx);
  text = text.slice(0, commaBeforeSecond) + text.slice(secondAdminEnd);

  const portalMarker = '\n  "portal": {';
  const portalIdx = text.indexOf(portalMarker);
  const adminCloseIdx = text.lastIndexOf('\n  },', portalIdx);
  const sectionsText = formatSections(sectionsToMerge);
  text = `${text.slice(0, adminCloseIdx)},\n${sectionsText}${text.slice(adminCloseIdx)}`;

  if (navLabel) {
    const target = '    "automation": {\n      "workloadTitle"';
    const replacement = `    "automation": {\n      "navLabel": ${JSON.stringify(navLabel)},\n      "workloadTitle"`;
    if (text.includes(target) && !text.includes('"navLabel"')) {
      text = text.replace(target, replacement);
    }
  }

  JSON.parse(text);
  fs.writeFileSync(filePath, `${text.trimEnd()}\n`);
  console.log(`${filename}: fixed`);
}

for (const file of ['es.json', 'ca.json', 'en.json']) {
  fixFile(file);
}
