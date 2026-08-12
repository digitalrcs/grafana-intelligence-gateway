import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { format } from 'prettier';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = path.join(root, 'testdata', 'datasource.csv');
const dashboardPath = path.join(root, 'provisioning', 'dashboards', 'dashboard.json');
const csvContent = (await readFile(csvPath, 'utf8')).trim();
const lines = csvContent.split(/\r?\n/);

if (lines[0] !== 'time,DC1,DC2' || lines.length < 2) {
  throw new Error('testdata/datasource.csv must contain the time,DC1,DC2 header and at least one data row.');
}

const timestamps = lines.slice(1).map((line, index) => {
  const [timestamp, dc1, dc2] = line.split(',');
  const value = Date.parse(timestamp);
  if (!Number.isFinite(value) || !Number.isFinite(Number(dc1)) || !Number.isFinite(Number(dc2))) {
    throw new Error(`Invalid CSV data on row ${index + 2}.`);
  }
  return value;
});
const grafanaCsvContent = [
  'Time,DC1,DC2',
  ...lines.slice(1).map((line) => line.replace(/^([^,]*)([+-]\d{2})(\d{2}),/, '$1$2:$3,')),
].join('\n');

const dashboard = JSON.parse(await readFile(dashboardPath, 'utf8'));
const sourcePanel = dashboard.panels.find((panel) => panel.id === 1);
if (!sourcePanel?.targets?.[0]) {
  throw new Error('The provisioned CSV source panel (panel 1) is missing.');
}

sourcePanel.targets[0].csvContent = grafanaCsvContent;
dashboard.time = {
  from: new Date(Math.min(...timestamps) - 12 * 60 * 60 * 1000).toISOString(),
  to: new Date(Math.max(...timestamps) + 12 * 60 * 60 * 1000).toISOString(),
};

await writeFile(dashboardPath, await format(JSON.stringify(dashboard), { parser: 'json' }));
console.log(`Synced ${lines.length - 1} CSV rows into ${path.relative(root, dashboardPath)}.`);
