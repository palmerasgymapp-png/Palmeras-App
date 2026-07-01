const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.env.DATA_DIR || __dirname, '.ghsync.json');

function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return { token: process.env.GH_TOKEN || '', repo: 'palmerasgymapp-png/Palmeras-App', enabled: !!process.env.GH_TOKEN };
  }
}

function saveConfig(cfg) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

function getRemoteWithToken(token) {
  return `https://palmerasgymapp-png:${token}@github.com/palmerasgymapp-png/Palmeras-App.git`;
}

function syncBackup(backupName, dataJson, callback) {
  const cfg = getConfig();
  if (typeof dataJson === 'function') { callback = dataJson; dataJson = null; }
  if (!cfg.enabled || !cfg.token) {
    if (callback) callback(null, 'GitHub sync disabled');
    return;
  }
  const backupPath = path.join(__dirname, 'backups', backupName);
  if (!fs.existsSync(backupPath)) {
    if (callback) callback(new Error('Backup file not found'));
    return;
  }
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dataJsonPath = path.join(dataDir, 'data.json');
  if (dataJson) fs.writeFileSync(dataJsonPath, dataJson, 'utf8');
  const remote = getRemoteWithToken(cfg.token);
  const cmds = [
    `git add -f "${backupPath}"`,
    `git add -f "${dataJsonPath}"`,
    `git commit -m "Respaldo automatico ${backupName}"`,
    `git push "${remote}" master`
  ];
  runChain(cmds, 0, callback);
}

function runChain(cmds, idx, callback) {
  if (idx >= cmds.length) { if (callback) callback(null, 'Synced'); return; }
  exec(cmds[idx], { cwd: __dirname, windowsHide: true }, (err, stdout, stderr) => {
    if (err && idx > 0) {
      if (callback) callback(null, 'Push skipped (no changes?)');
      return;
    }
    runChain(cmds, idx + 1, callback);
  });
}

module.exports = { getConfig, saveConfig, syncBackup };
