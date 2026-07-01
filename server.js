const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
const db = require('./database');
const ghsync = require('./ghsync');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Serve mobile app folder for direct access (GitHub Pages compatible path)
app.use('/Movil', express.static(path.join(__dirname, 'Movil')));

// Serve root-level static assets
app.get('/logo.png', (req, res) => { res.sendFile(path.join(__dirname, 'logo.png')); });
app.get('/logo_small.png', (req, res) => { res.sendFile(path.join(__dirname, 'logo_small.png')); });

// Server info (LAN IP and port for QR / mobile client access)
app.get('/api/server/info', (req, res) => {
  try {
    const nets = os.networkInterfaces();
    let ip = '127.0.0.1';
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          ip = net.address;
          break;
        }
      }
      if (ip !== '127.0.0.1') break;
    }
    res.json({ ip, port: PORT, url: `http://${ip}:${PORT}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Mobile app (legacy routes)
app.get(['/app', '/movil'], (req, res) => {
  res.sendFile(path.join(__dirname, 'Movil', 'movil.html'));
});

// ── Exercises ──
app.get('/api/exercises', (req, res) => {
  try { res.json(db.allExercises()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/exercises/:id', (req, res) => {
  try {
    const ex = db.getExercise(req.params.id);
    if (!ex) return res.status(404).json({ error: 'Not found' });
    res.json(ex);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/exercises', (req, res) => {
  try {
    const { id, name, category, muscles, description, imageUrl, videoUrl } = req.body;
    if (!id || !name || !category) return res.status(400).json({ error: 'id, name, category required' });
    const ex = db.createExercise({ id, name, category, muscles, description, image_url: imageUrl, video_url: videoUrl });
    res.status(201).json(ex);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/exercises/:id', (req, res) => {
  try {
    const { imageUrl, videoUrl, ...rest } = req.body;
    const ex = db.updateExercise(req.params.id, { ...rest, image_url: imageUrl, video_url: videoUrl });
    if (!ex) return res.status(404).json({ error: 'Not found' });
    res.json(ex);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/exercises/:id', (req, res) => {
  try {
    db.deleteExercise(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Routines ──
app.get('/api/routines', (req, res) => {
  try { res.json(db.allRoutines()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/routines/:id', (req, res) => {
  try {
    const rt = db.getRoutine(req.params.id);
    if (!rt) return res.status(404).json({ error: 'Not found' });
    res.json(rt);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/routines', (req, res) => {
  try {
    const { id, name, category, exercises } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id, name required' });
    const rt = db.createRoutine({ id, name, category, exercises });
    res.status(201).json(rt);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/routines/:id', (req, res) => {
  try {
    const rt = db.updateRoutine(req.params.id, req.body);
    if (!rt) return res.status(404).json({ error: 'Not found' });
    res.json(rt);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/routines/:id', (req, res) => {
  try {
    db.deleteRoutine(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Clients ──
app.get('/api/clients', (req, res) => {
  try { res.json(db.allClients()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/clients/:id', (req, res) => {
  try {
    const cl = db.getClient(req.params.id);
    if (!cl) return res.status(404).json({ error: 'Not found' });
    res.json(cl);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clients', (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id, name required' });
    const cl = db.createClient(req.body);
    res.status(201).json(cl);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clients/:id', (req, res) => {
  try {
    const cl = db.updateClient(req.params.id, req.body);
    if (!cl) return res.status(404).json({ error: 'Not found' });
    res.json(cl);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/clients/:id', (req, res) => {
  try {
    db.deleteClient(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clients/:id/routines', (req, res) => {
  try {
    const { routineId } = req.body;
    if (!routineId) return res.status(400).json({ error: 'routineId required' });
    const cl = db.assignRoutine(req.params.id, routineId);
    if (!cl) return res.status(404).json({ error: 'Client not found' });
    res.json(cl);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/clients/:id/routines/:routineId', (req, res) => {
  try {
    const cl = db.unassignRoutine(req.params.id, req.params.routineId);
    if (!cl) return res.status(404).json({ error: 'Client not found' });
    res.json(cl);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clients/:id/verify-password', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'password required' });
    const valid = db.verifyPassword(req.params.id, password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });
    const client = db.getClient(req.params.id);
    res.json({ success: true, client });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clients/:id/regenerate-password', (req, res) => {
  try {
    const pwd = db.generatePassword();
    db.updateClient(req.params.id, { password: pwd });
    res.json({ password: pwd });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Client Dashboard & Workouts (Mobile) ──
app.get('/api/clients/:id/dashboard', (req, res) => {
  try {
    const data = db.getClientDashboard(req.params.id);
    if (!data) return res.status(404).json({ error: 'Client not found' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/clients/:id/routines-detail', (req, res) => {
  try {
    const routines = db.getClientRoutinesWithDetail(req.params.id);
    res.json(routines);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

let lastAutoBackup = 0;
function autoBackup() {
  const now = Date.now();
  if (now - lastAutoBackup < 300000) return;
  lastAutoBackup = now;
  try {
    const backup = db.createBackup();
    const dataJson = JSON.stringify(db.exportAll(), null, 2);
    ghsync.syncBackup(backup.name, dataJson, (err) => {
      if (err) console.error('Auto-sync error:', err.message);
    });
  } catch (e) { console.error('Auto-backup error:', e.message); }
}

app.post('/api/clients/:id/workout/start', (req, res) => {
  try {
    const { routineId } = req.body;
    if (!routineId) return res.status(400).json({ error: 'routineId required' });
    const log = db.startWorkout(req.params.id, routineId);
    autoBackup();
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/workout/:logId/complete', (req, res) => {
  try {
    const log = db.completeWorkout(req.params.logId);
    if (!log) return res.status(404).json({ error: 'Workout log not found' });
    autoBackup();
    res.json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/clients/:id/workout/history', (req, res) => {
  try {
    const history = db.getWorkoutHistory(req.params.id);
    res.json(history);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/clients/:id/workout/active', (req, res) => {
  try {
    const active = db.getActiveWorkout(req.params.id);
    res.json(active || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Backup & Restore ──
const multer = require('multer');
const UPLOAD_DIR = path.join(process.env.DATA_DIR || __dirname, 'uploads');
const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 100 * 1024 * 1024 } });
app.get('/api/backup/info', (req, res) => {
  try { res.json(db.getDbInfo()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backup/download', (req, res) => {
  try {
    const buf = db.exportBuffer();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="palmerasgym_${new Date().toISOString().replace(/[:.]/g,'-')}.db"`);
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/backup/create', (req, res) => {
  try {
    const backup = db.createBackup();
    const dataJson = JSON.stringify(db.exportAll(), null, 2);
    ghsync.syncBackup(backup.name, dataJson, (err, msg) => {
      if (err) console.error('GitHub sync error:', err.message);
      else if (msg) console.log('GitHub sync:', msg);
    });
    res.json(Object.assign(backup, { data: JSON.parse(dataJson) }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backup/history', (req, res) => {
  try { res.json(db.listBackups()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/backup/restore', upload.single('backup'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const newBuffer = Buffer.from(buffer);
    // Validate it's a SQLite file (starts with SQLite header)
    if (newBuffer.length < 16 || newBuffer.toString('utf8', 0, 16) !== 'SQLite format 3\x00') {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'El archivo no es una base de datos SQLite válida' });
    }
    // Auto-backup current state before restoring
    const preBackup = db.createBackup();
    // Restore the uploaded database
    db.importBuffer(newBuffer);
    fs.unlinkSync(filePath);
    res.json({ success: true, autoBackup: preBackup, message: 'Base de datos restaurada correctamente' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/backup/:name', (req, res) => {
  try {
    const backupPath = path.join(db.getBackupDir(), req.params.name);
    if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'Backup no encontrado' });
    fs.unlinkSync(backupPath);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GitHub Sync ──
app.get('/api/backup/ghsync', (req, res) => {
  try {
    const cfg = ghsync.getConfig();
    res.json({ token: cfg.token ? '••••' + cfg.token.slice(-4) : '', repo: cfg.repo, enabled: cfg.enabled });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/backup/ghsync', (req, res) => {
  try {
    const { token, enabled } = req.body;
    const cfg = ghsync.getConfig();
    if (token !== undefined && token !== '') cfg.token = token;
    if (enabled !== undefined) cfg.enabled = !!enabled;
    ghsync.saveConfig(cfg);
    res.json({ success: true, token: cfg.token ? '••••' + cfg.token.slice(-4) : '', enabled: cfg.enabled });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Weekly Schedule ──
app.get('/api/clients/:clientId/weekly-schedule', (req, res) => {
  try { res.json(db.getWeeklySchedule(req.params.clientId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clients/:clientId/weekly-schedule', (req, res) => {
  try {
    const { dayOfWeek, routineId } = req.body;
    if (dayOfWeek === undefined || dayOfWeek === null || !routineId) return res.status(400).json({ error: 'dayOfWeek and routineId required' });
    db.setWeeklyScheduleDay(req.params.clientId, dayOfWeek, routineId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/clients/:clientId/weekly-schedule/:day', (req, res) => {
  try {
    db.removeWeeklyScheduleDay(req.params.clientId, parseInt(req.params.day));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Git / GitHub ──
const { execSync } = require('child_process');

function runGit(...args) {
  try {
    const out = execSync('git ' + args.join(' '), { cwd: __dirname, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { success: true, output: out.trim() };
  } catch (e) {
    return { success: false, output: (e.stdout || '') + (e.stderr || ''), error: e.message };
  }
}
function ensureGitUser() {
  try { execSync('git config --global user.email', { cwd: __dirname, stdio: 'pipe' }); } catch {
    execSync('git config --global user.email "palmerasgym@localhost"', { cwd: __dirname, stdio: 'pipe' });
  }
  try { execSync('git config --global user.name', { cwd: __dirname, stdio: 'pipe' }); } catch {
    execSync('git config --global user.name "Palmeras Gym HQ"', { cwd: __dirname, stdio: 'pipe' });
  }
}

app.post('/api/git/init', (req, res) => {
  try {
    const r = runGit('init');
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/git/status', (req, res) => {
  try {
    // Check if git is installed
    let gitInstalled = false;
    try { execSync('git --version', { stdio: 'pipe' }); gitInstalled = true; } catch {}
    // Check if repo
    const isRepo = fs.existsSync(path.join(__dirname, '.git'));
    // Branch
    let branch = null;
    const br = runGit('rev-parse', '--abbrev-ref', 'HEAD');
    if (br.success) branch = br.output;
    // Remote
    let remoteUrl = null;
    const rm = runGit('remote', 'get-url', 'origin');
    if (rm.success) remoteUrl = rm.output;
    // Status
    let status = null;
    const st = runGit('status', '--porcelain');
    if (st.success) status = st.output ? st.output.split('\n').filter(Boolean) : [];
    // Commits
    let commitCount = 0;
    const cc = runGit('rev-list', '--count', 'HEAD');
    if (cc.success) commitCount = parseInt(cc.output) || 0;
    // Last commit
    let lastCommit = null;
    const lc = runGit('log', '-1', '--format=%h %s (%ar)');
    if (lc.success) lastCommit = lc.output;
    const repoName = remoteUrl ? remoteUrl.replace(/.*\/(.*?)\.git$/, '$1') : null;
    res.json({ gitInstalled, isRepo, branch, remoteUrl, repoName, status, commitCount, lastCommit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/git/commit', (req, res) => {
  try {
    ensureGitUser();
    const msg = req.body.message || 'Actualización Palmeras Gym HQ - ' + new Date().toLocaleString();
    let output = [];
    const add = runGit('add', '.');
    output.push('git add . → ' + (add.success ? 'OK' : add.error));
    if (!add.success) return res.json({ success: false, output });
    const commit = runGit('commit', '-m', '"' + msg.replace(/"/g, '') + '"');
    output.push('git commit → ' + (commit.success ? commit.output : commit.error));
    res.json({ success: commit.success, output: output.join('\n') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/git/remote', (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'repoUrl required' });
    let output = [];
    // Remove existing origin if any
    const rm = runGit('remote', 'remove', 'origin');
    const add = runGit('remote', 'add', 'origin', repoUrl);
    output.push('remote add origin ' + repoUrl + ' → ' + (add.success ? 'OK' : add.error));
    res.json({ success: add.success, output: output.join('\n') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/git/push', (req, res) => {
  try {
    const { token, repoUrl, message } = req.body;
    let output = [];
    ensureGitUser();
    // Init if needed
    if (!fs.existsSync(path.join(__dirname, '.git'))) {
      const init = runGit('init');
      output.push('git init → ' + (init.success ? 'OK' : init.error));
    }
    // Add
    const add = runGit('add', '.');
    output.push('git add . → ' + (add.success ? 'OK' : add.error));
    if (!add.success) return res.json({ success: false, output: output.join('\n') });
    // Commit
    const msg = message || 'Palmeras Gym HQ update - ' + new Date().toISOString().slice(0, 19).replace('T', ' ');
    const commit = runGit('commit', '-m', '"' + msg.replace(/"/g, '') + '"');
    output.push('git commit → ' + (commit.success ? commit.output.split('\n')[0] : commit.error));
    // Set remote
    if (repoUrl) {
      runGit('remote', 'remove', 'origin');
      let pushUrl = repoUrl;
      if (token) {
        // Insert token into URL for HTTPS auth
        pushUrl = repoUrl.replace('https://', 'https://' + token + '@');
      }
      const remote = runGit('remote', 'add', 'origin', pushUrl);
      output.push('remote set → OK');
      // Detect branch
      let branch = 'master';
      const br = runGit('rev-parse', '--abbrev-ref', 'HEAD');
      if (br.success) branch = br.output;
      let push = runGit('push', '-u', 'origin', branch);
      if (!push.success && push.error && push.error.includes('[rejected]')) {
        output.push('git push rechazado, intentando con --force...');
        push = runGit('push', '-u', '--force', 'origin', branch);
      }
      output.push('git push → ' + (push.success ? '¡Publicado!' : push.error));
      res.json({ success: push.success, output: output.join('\n') });
    } else {
      res.json({ success: true, output: output.join('\n') + '\n(Sin remote configurado)' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Start ──
async function start() {
  await db.init();
  db.seed();
  // Ensure writable directories exist
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  return new Promise((resolve, reject) => {
    const srv = app.listen(PORT, () => {
      console.log(`Palmeras Gym HQ server running at http://localhost:${PORT}`);
      resolve();
    });
    srv.on('error', (e) => {
      console.error('Server error:', e.message);
      reject(e);
    });
  });
}

if (require.main === module) {
  start().catch(e => {
    console.error('Failed to start server:', e);
    process.exit(1);
  });
}

module.exports = { app, start };
