const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '.ghsync.json');

function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return { token: '', repo: 'palmerasgymapp-png/Palmeras-App', enabled: false };
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

function getRemoteWithToken(token) {
  return `https://palmerasgymapp-png:${token}@github.com/palmerasgymapp-png/Palmeras-App.git`;
}

function syncBackup(backupName, callback) {
  const cfg = getConfig();
  if (!cfg.enabled || !cfg.token) {
    if (callback) callback(null, 'GitHub sync disabled');
    return;
  }
  const backupPath = path.join(__dirname, 'backups', backupName);
  if (!fs.existsSync(backupPath)) {
    if (callback) callback(new Error('Backup file not found'));
    return;
  }
  const remote = getRemoteWithToken(cfg.token);
  const cmds = [
    `git add -f "${backupPath}"`,
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
