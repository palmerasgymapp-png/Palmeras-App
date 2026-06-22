const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'palmerasgym.db');
const BACKUP_DIR = path.join(__dirname, 'backups');
let db = null;
let SQL = null;

function getDbPath() { return DB_PATH }
function getBackupDir() { return BACKUP_DIR }

async function init() {
  SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
  createTables();
  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      muscles TEXT DEFAULT '',
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS routine_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      sets INTEGER DEFAULT 3,
      reps TEXT DEFAULT '10-12',
      rest TEXT DEFAULT '60s',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      streak INTEGER DEFAULT 0,
      pago_inicio TEXT DEFAULT '',
      pago_fin TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS client_routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      routine_id TEXT NOT NULL,
      assigned_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
    )
  `);
  try { db.run("SELECT client_id FROM weekly_schedule LIMIT 1"); } catch (e) {
    try { db.run('DROP TABLE weekly_schedule'); } catch (e2) {}
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS weekly_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      routine_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
    )
  `);
  try { db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_client_day ON weekly_schedule(client_id, day_of_week)'); } catch (e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN password TEXT DEFAULT ''"); } catch (e) {}
  db.run(`
    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      routine_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT DEFAULT 'in_progress',
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
    )
  `);
  // Migrations for existing DBs
  try { db.run('ALTER TABLE clients ADD COLUMN streak INTEGER DEFAULT 0'); } catch (e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN pago_inicio TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE clients ADD COLUMN pago_fin TEXT DEFAULT ''"); } catch (e) {}
}

function save() {
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    autoBackup();
  } catch (e) {
    console.error('Error saving database:', e.message);
  }
}

let lastAutoBackup = 0;
const MAX_AUTO_BACKUPS = 30;

function autoBackup() {
  const now = Date.now();
  if (now - lastAutoBackup < 60000) return;
  lastAutoBackup = now;
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const d = new Date();
    const ts = d.getFullYear() +
      String(d.getMonth()+1).padStart(2,'0') +
      String(d.getDate()).padStart(2,'0') + '_' +
      String(d.getHours()).padStart(2,'0') +
      String(d.getMinutes()).padStart(2,'0') +
      String(d.getSeconds()).padStart(2,'0');
    const name = `auto_palmerasgym_${ts}.db`;
    fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, name));
    // Prune old backups keeping max MAX_AUTO_BACKUPS
    const all = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.db'))
      .map(f => ({ name: f, path: path.join(BACKUP_DIR, f), mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    if (all.length > MAX_AUTO_BACKUPS) {
      all.slice(MAX_AUTO_BACKUPS).forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    }
  } catch (e) {
    console.error('Auto-backup error:', e.message);
  }
}

function exportBuffer() {
  save();
  return fs.readFileSync(DB_PATH);
}

function importBuffer(buffer) {
  if (!SQL) throw new Error('Database not initialized');
  const oldDb = db;
  try {
    db = new SQL.Database(buffer);
    db.run('PRAGMA foreign_keys = ON');
    createTables();
    save();
    if (oldDb && typeof oldDb.close === 'function') oldDb.close();
    return true;
  } catch (e) {
    db = oldDb;
    throw e;
  }
}

function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  save();
  const now = new Date();
  const ts = now.getFullYear() +
    String(now.getMonth()+1).padStart(2,'0') +
    String(now.getDate()).padStart(2,'0') + '_' +
    String(now.getHours()).padStart(2,'0') +
    String(now.getMinutes()).padStart(2,'0') +
    String(now.getSeconds()).padStart(2,'0');
  const backupPath = path.join(BACKUP_DIR, `palmerasgym_${ts}.db`);
  fs.copyFileSync(DB_PATH, backupPath);
  return { path: backupPath, name: `palmerasgym_${ts}.db`, timestamp: now.toISOString(), size: fs.statSync(backupPath).size };
}

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const p = path.join(BACKUP_DIR, f);
      const s = fs.statSync(p);
      return { name: f, path: p, size: s.size, timestamp: s.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getDbInfo() {
  save();
  const stats = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH) : null;
  return {
    size: stats ? stats.size : 0,
    modifiedAt: stats ? stats.mtime.toISOString() : null,
    exercises: count('exercises'),
    routines: count('routines'),
    clients: count('clients'),
    backups: listBackups().length,
    lastBackup: listBackups().length > 0 ? listBackups()[0].timestamp : null
  };
}

// ── Exercises ──
function allExercises() {
  const stmt = db.prepare('SELECT * FROM exercises ORDER BY updated_at DESC');
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function getExercise(id) {
  const stmt = db.prepare('SELECT * FROM exercises WHERE id = ?');
  stmt.bind([id]);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
}

function createExercise(data) {
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO exercises (id, name, category, muscles, description, image_url, video_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [data.id, data.name, data.category, data.muscles || '', data.description || '', data.image_url || '', data.video_url || '', now, now]
  );
  save();
  return getExercise(data.id);
}

function updateExercise(id, data) {
  const now = new Date().toISOString();
  const existing = getExercise(id);
  if (!existing) return null;
  db.run(
    'UPDATE exercises SET name=?, category=?, muscles=?, description=?, image_url=?, video_url=?, updated_at=? WHERE id=?',
    [
      data.name ?? existing.name,
      data.category ?? existing.category,
      data.muscles ?? existing.muscles,
      data.description ?? existing.description,
      data.image_url ?? existing.image_url,
      data.video_url ?? existing.video_url ?? '',
      now,
      id
    ]
  );
  save();
  return getExercise(id);
}

function deleteExercise(id) {
  db.run('DELETE FROM exercises WHERE id = ?', [id]);
  save();
}

// ── Routines ──
function allRoutines() {
  const stmt = db.prepare('SELECT * FROM routines ORDER BY updated_at DESC');
  const rows = [];
  while (stmt.step()) {
    const r = stmt.getAsObject();
    r.exercises = getRoutineExercises(r.id);
    rows.push(r);
  }
  stmt.free();
  return rows;
}

function getRoutine(id) {
  const stmt = db.prepare('SELECT * FROM routines WHERE id = ?');
  stmt.bind([id]);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  if (result) result.exercises = getRoutineExercises(id);
  return result;
}

function getRoutineExercises(routineId) {
  const stmt = db.prepare('SELECT re.*, e.name AS exercise_name FROM routine_exercises re LEFT JOIN exercises e ON re.exercise_id = e.id WHERE re.routine_id = ? ORDER BY re.sort_order');
  stmt.bind([routineId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function createRoutine(data) {
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO routines (id, name, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [data.id, data.name, data.category || '', now, now]
  );
  if (data.exercises && Array.isArray(data.exercises)) {
    const ins = db.prepare('INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    data.exercises.forEach((ex, i) => {
      ins.run([data.id, ex.exerciseId, ex.sets || 3, ex.reps || '10-12', ex.rest || '60s', i]);
    });
    ins.free();
  }
  save();
  return getRoutine(data.id);
}

function updateRoutine(id, data) {
  const now = new Date().toISOString();
  const existing = getRoutine(id);
  if (!existing) return null;
  db.run(
    'UPDATE routines SET name=?, category=?, updated_at=? WHERE id=?',
    [data.name ?? existing.name, data.category ?? existing.category, now, id]
  );
  db.run('DELETE FROM routine_exercises WHERE routine_id = ?', [id]);
  if (data.exercises && Array.isArray(data.exercises)) {
    const ins = db.prepare('INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    data.exercises.forEach((ex, i) => {
      ins.run([id, ex.exerciseId, ex.sets || 3, ex.reps || '10-12', ex.rest || '60s', i]);
    });
    ins.free();
  }
  save();
  return getRoutine(id);
}

function deleteRoutine(id) {
  db.run('DELETE FROM routines WHERE id = ?', [id]);
  save();
}

// ── Clients ──
function allClients() {
  const stmt = db.prepare('SELECT * FROM clients ORDER BY created_at DESC');
  const rows = [];
  while (stmt.step()) {
    const c = stmt.getAsObject();
    c.assignedRoutines = getClientRoutines(c.id);
    rows.push(c);
  }
  stmt.free();
  return rows;
}

function getClient(id) {
  const stmt = db.prepare('SELECT * FROM clients WHERE id = ?');
  stmt.bind([id]);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  if (result) result.assignedRoutines = getClientRoutines(id);
  return result;
}

function getClientRoutines(clientId) {
  const stmt = db.prepare('SELECT routine_id FROM client_routines WHERE client_id = ?');
  stmt.bind([clientId]);
  const ids = [];
  while (stmt.step()) ids.push(stmt.getAsObject().routine_id);
  stmt.free();
  return ids;
}

function createClient(data) {
  const now = new Date().toISOString();
  const password = data.password || generatePassword();
  db.run(
    'INSERT INTO clients (id, name, email, phone, notes, streak, pago_inicio, pago_fin, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [data.id, data.name, data.email || '', data.phone || '', data.notes || '', data.streak || 0, data.pago_inicio || '', data.pago_fin || '', password, now, now]
  );
  save();
  return getClient(data.id);
}

function updateClient(id, data) {
  const now = new Date().toISOString();
  const existing = getClient(id);
  if (!existing) return null;
  db.run(
    'UPDATE clients SET name=?, email=?, phone=?, notes=?, streak=?, pago_inicio=?, pago_fin=?, password=?, updated_at=? WHERE id=?',
    [
      data.name ?? existing.name,
      data.email ?? existing.email,
      data.phone ?? existing.phone,
      data.notes ?? existing.notes,
      data.streak ?? existing.streak ?? 0,
      data.pago_inicio ?? existing.pago_inicio ?? '',
      data.pago_fin ?? existing.pago_fin ?? '',
      data.password ?? existing.password ?? '',
      now,
      id
    ]
  );
  save();
  const updated = getClient(id);
  if (data.assignedRoutines) {
    db.run('DELETE FROM client_routines WHERE client_id = ?', [id]);
    const ins = db.prepare('INSERT INTO client_routines (client_id, routine_id, assigned_at) VALUES (?, ?, ?)');
    data.assignedRoutines.forEach(rid => {
      ins.run([id, rid, now]);
    });
    ins.free();
    save();
  }
  return getClient(id);
}

function deleteClient(id) {
  db.run('DELETE FROM clients WHERE id = ?', [id]);
  save();
}

function assignRoutine(clientId, routineId) {
  const now = new Date().toISOString();
  db.run('INSERT INTO client_routines (client_id, routine_id, assigned_at) VALUES (?, ?, ?)', [clientId, routineId, now]);
  save();
  return getClient(clientId);
}

function unassignRoutine(clientId, routineId) {
  db.run('DELETE FROM client_routines WHERE client_id = ? AND routine_id = ?', [clientId, routineId]);
  save();
  return getClient(clientId);
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

function verifyPassword(clientId, password) {
  const stmt = db.prepare('SELECT password FROM clients WHERE id = ?');
  stmt.bind([clientId]);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result && result.password === password;
}

// ── Workout Logs ──
function startWorkout(clientId, routineId) {
  const now = new Date().toISOString();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  db.run(
    'INSERT INTO workout_logs (id, client_id, routine_id, started_at, status) VALUES (?, ?, ?, ?, ?)',
    [id, clientId, routineId, now, 'in_progress']
  );
  save();
  return getWorkoutLog(id);
}

function getWorkoutLog(id) {
  const stmt = db.prepare('SELECT * FROM workout_logs WHERE id = ?');
  stmt.bind([id]);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
}

function completeWorkout(logId) {
  const now = new Date().toISOString();
  db.run('UPDATE workout_logs SET completed_at=?, status=? WHERE id=?', [now, 'completed', logId]);
  save();
  return getWorkoutLog(logId);
}

function getWorkoutHistory(clientId) {
  const stmt = db.prepare('SELECT * FROM workout_logs WHERE client_id = ? ORDER BY started_at DESC');
  stmt.bind([clientId]);
  const rows = [];
  while (stmt.step()) {
    const r = stmt.getAsObject();
    const rt = getRoutine(r.routine_id);
    r.routine_name = rt ? rt.name : 'Desconocida';
    rows.push(r);
  }
  stmt.free();
  return rows;
}

function getActiveWorkout(clientId) {
  const stmt = db.prepare("SELECT * FROM workout_logs WHERE client_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1");
  stmt.bind([clientId]);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  if (result) {
    const rt = getRoutine(result.routine_id);
    result.routine_name = rt ? rt.name : 'Desconocida';
    result.routine = rt;
  }
  return result;
}

function getClientRoutinesWithDetail(clientId) {
  const routineIds = getClientRoutines(clientId);
  return routineIds.map(id => getRoutine(id)).filter(Boolean);
}

function getWeeklyStats(clientId) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const isoStart = startOfWeek.toISOString();
  // Completed workouts this week
  const stmt = db.prepare("SELECT * FROM workout_logs WHERE client_id = ? AND status='completed' AND completed_at >= ?");
  stmt.bind([clientId, isoStart]);
  const completed = [];
  while (stmt.step()) completed.push(stmt.getAsObject());
  stmt.free();
  // In progress
  const active = getActiveWorkout(clientId);
  return {
    workoutsCompletedThisWeek: completed.length,
    weeklyGoal: 5,
    caloriesBurned: completed.length * 250,
    hoursActive: (completed.length * 0.75).toFixed(1),
    progressPercent: Math.min(100, Math.round((completed.length / 5) * 100)),
    activeWorkout: active
  };
}

function getClientDashboard(clientId) {
  const client = getClient(clientId);
  if (!client) return null;
  const routines = getClientRoutinesWithDetail(clientId);
  const stats = getWeeklyStats(clientId);
  return {
    client,
    routines,
    stats,
    nextRoutine: routines.length > 0 ? routines[0] : null
  };
}

// ── Weekly Schedule ──
function getWeeklySchedule(clientId) {
  const stmt = db.prepare(`
    SELECT ws.day_of_week, ws.routine_id, r.name as routine_name, r.category as routine_category,
      (SELECT COUNT(*) FROM routine_exercises re WHERE re.routine_id = ws.routine_id) as exercise_count
    FROM weekly_schedule ws
    LEFT JOIN routines r ON ws.routine_id = r.id
    WHERE ws.client_id = ?
    ORDER BY ws.day_of_week
  `);
  stmt.bind([clientId]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function setWeeklyScheduleDay(clientId, dayOfWeek, routineId) {
  const now = new Date().toISOString();
  db.run(
    'INSERT INTO weekly_schedule (client_id, day_of_week, routine_id, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(client_id, day_of_week) DO UPDATE SET routine_id = excluded.routine_id, created_at = excluded.created_at',
    [clientId, dayOfWeek, routineId, now]
  );
  save();
}

function removeWeeklyScheduleDay(clientId, dayOfWeek) {
  db.run('DELETE FROM weekly_schedule WHERE client_id = ? AND day_of_week = ?', [clientId, dayOfWeek]);
  save();
}

// ── Seed ──
function count(table) {
  const stmt = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`);
  stmt.step();
  const result = stmt.getAsObject().cnt;
  stmt.free();
  return result;
}

function seed() {
  if (count('exercises') > 0) return;
  const exercises = [
    { id: 'ex1', name: 'Sentadilla con Barra', category: 'Fuerza', muscles: 'Cuádriceps, Glúteos', description: 'Ejercicio compuesto fundamental para el desarrollo de piernas. Mantén la espalda recta y baja hasta que los muslos estén paralelos al suelo.', image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLslG9HUJyj1WpScCiq3GwHK-G7UJok5FuXxrQuQRniZiCA5fcOg7pkFxxJNGWqaFpYXZwK1QbOk07iMkC7Cod8tmFpXGwMHv_cbZXAgn0K_EPRMxjH48GgRw5ackMsjDvvGadEge8nPvSUa8wdIMq9Mt9JJ8iW-2EJsj30N3QZ407xCh4u4c3ATT95teijPXNsyug6hdtJ6Yy-9bREbzOpKLI9He9fAsm5iBodUkdGvITEPoEAuj_OrYPU', video_url: 'https://www.youtube.com/watch?v=UaNwCwCvjJM', created_at: '2026-05-20T10:00:00Z', updated_at: '2026-06-05T14:30:00Z' },
    { id: 'ex2', name: 'Sprint por Intervalos', category: 'Cardio', muscles: 'Cuerpo Completo, Aeróbico', description: 'Entrenamiento de alta intensidad en cinta o pista. Alterna sprints máximos con recuperación activa.', image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLs1ywmbimwabWLl3ww787vOEKXmmR6lV4f9C_wwFD0qTSsTpjVcQgL2OoBrwQ8m7RxpLPvLw0b8jcnWUc6iDPjmVDKbZg3Nf3FeQaTgIHrJ6BTy-7EAzVvFSDZOMTKzPdLVMNS1yENLYF9Evl4mpzh3n7rjWz7-y-CDjYjVZsvwYU2GEOJw5vbZDbquDhVpEDcaD9d9BdpJd4LPoMLWFvQmzbxZHEYKIABrdum7pYl9_iDPRaoG81zuUmE', video_url: 'https://www.youtube.com/watch?v=qaCwWDvjnSA', created_at: '2026-05-18T08:00:00Z', updated_at: '2026-05-30T11:00:00Z' },
    { id: 'ex3', name: 'Flujo Postura Paloma', category: 'Flexibilidad', muscles: 'Caderas, Espalda Baja', description: 'Postura de yoga para apertura profunda de cadera. Mantén la respiración constante y relaja la tensión.', image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLucfG9IJpyxx6OEkPmHVZsTYx_vrwIeBpPd9t0SpnVIm-Pou_EMEyZCavmzQNDBDVvVXTcayanZOHQdXJTaiQX9ZXJ-d_qFFTycvLs0oCj8ZUXHiza7TdlHTYDz0-CUVLTQhLplfv0FOmEGxntC2zrOiyvXrWVaP3zDg3ucOYU0g2CZtIrpHOh9kSe2JalYglcH9vpYNUtspKL0wzc-IfttE4sknYuz-CH1_3eTXRCVIRxeV3H8jw7in6M', video_url: '', created_at: '2026-06-07T06:00:00Z', updated_at: '2026-06-07T09:00:00Z' },
    { id: 'ex4', name: 'Press de Banca con Mancuernas', category: 'Fuerza', muscles: 'Pectorales, Tríceps', description: 'Variación con mancuernas que permite mayor rango de movimiento y activación unilateral.', image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLvpZ5_9yv-U79hW-zMDk4fuNMZjMG5tstFVKPZkTLrHCAL89lDTFFN0dFknAX6QHc6RYSbWcHdQhTqyk6mZU1t62HGdtj9-KHe64niocTbU5TyKH0L2pMYdCLO52GWG-gXuCNxZECifXkgD5CtmfyIW0_U9AvMv4YDG8SOdFUkIf5TycnQJ8OBcfSzGDeCOIep-OJucYeiDHrW747UxS5zXNc3xZ7C6yQ2rfJB3k3aesfUJGqSQlEaYqQ', video_url: 'https://www.youtube.com/watch?v=Zgxs-lG2A-I', created_at: '2026-05-25T12:00:00Z', updated_at: '2026-06-02T16:00:00Z' },
    { id: 'ex5', name: 'Salto de Comba Rápido', category: 'Cardio', muscles: 'Cuerpo Completo, Coordinación', description: 'Ejercicio cardiovascular de alto impacto. Mantén un ritmo constante y utiliza la muñeca para girar la cuerda.', image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLtbsWZx6VBJ-XQA-986a5DjIO5hzndf7zCpTFefwhHw9XYJMM1a9tvy9WUetcPEJ8QVxKLqFrN4AkXl9Zqn5Djy-tItrT1wtyyDYwOSQbt3zRCzYF5kbtMhYmFoJPk1JHVG8Exb5-B7f1BbebNtxUWW10hfNE_Rt_H4VccQtIaSlwkd2gWFT5dYsMCmOTbmvSIwPtgn8H1XwkMHufwxUYNIf_6mjU7P_WF9QmyJLs2Knpg6NpTooHRQGIo', video_url: '', created_at: '2026-05-15T09:00:00Z', updated_at: '2026-05-28T13:00:00Z' },
    { id: 'ex6', name: 'Dominada con Lastre', category: 'Fuerza', muscles: 'Dorsal Ancho, Bíceps', description: 'Dominada clásica con peso adicional. Agarre prono y activación escapular al inicio del movimiento.', image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLu_jAAsEppFSgUwyAak-IaRBNYMd3XIRk97oo4_iwRjjf1rnEvrzEY7KZdqQgAylsNU0Rj9zCbrq0qmdI7lYx3oKvS1sQkfvme7t9swCvWyBDUty2A63_RlDt1tlQTuZIAoG3oOajnlPWVC5CIgqANVWj7JimI1g8jN8XOr5U31BfRS5PdhdE6iqoZ5UL7MUjkU5IOneboC90ucojwPrmLIDXbgrveIAhIdHnQnswlKSs7QUMvsd0fZdAE', video_url: 'https://www.youtube.com/watch?v=eGo4I5rX1mk', created_at: '2026-04-20T10:00:00Z', updated_at: '2026-05-20T15:00:00Z' },
    { id: 'ex7', name: 'Swing con Pesa Rusa', category: 'Fuerza', muscles: 'Cadena Posterior, Glúteos', description: 'Movimiento balístico de cadera. La potencia debe venir de las caderas, no de los brazos.', image_url: 'https://lh3.googleusercontent.com/aida/AP1WRLtf2LXWFBYuLohr1sGMY8F3yppWX9wMJ7yTE0ghCnPPSz6tsQVpKN_WjuiLTKK3il06TAYrK6Derug9f0Nv5Vn_0k_KX0fXdGyG2-bkZjmL5Q9aZpP9-82HKMxOEulhBv9W0GBjzgMFGTpqDNIiOm5_xcDOXlZLh3ht5Jp9ZrddMT4Rc5L_WCJpKhn3Fik_QCNlVooXg6vS8AmFs0PDQpMmOkKU9anh1J-YWIzL-R8NjQWicFCEj26zaQ', video_url: '', created_at: '2026-05-10T11:00:00Z', updated_at: '2026-05-22T09:00:00Z' },
    { id: 'ex8', name: 'Peso Muerto Rumano', category: 'Fuerza', muscles: 'Isquiotibiales, Glúteos', description: 'Variante de peso muerto que enfatiza la cadena posterior. Mantén una ligera flexión de rodilla.', image_url: '', video_url: 'https://www.youtube.com/watch?v=7wNoTbVzQbI', created_at: '2026-05-30T08:00:00Z', updated_at: '2026-06-01T12:00:00Z' }
  ];
  const ins = db.prepare('INSERT INTO exercises (id, name, category, muscles, description, image_url, video_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  exercises.forEach(e => ins.run([e.id, e.name, e.category, e.muscles, e.description, e.image_url, e.video_url || '', e.created_at, e.updated_at]));
  ins.free();

  const routines = [
    { id: 'rt1', name: 'Full Body Principiante', category: 'Full Body', exercises: [{ exerciseId: 'ex1', sets: 3, reps: '10-12', rest: '90s' }, { exerciseId: 'ex4', sets: 3, reps: '10-12', rest: '90s' }, { exerciseId: 'ex7', sets: 3, reps: '15', rest: '60s' }], created_at: '2026-06-01T10:00:00Z', updated_at: '2026-06-01T10:00:00Z' },
    { id: 'rt2', name: 'Cardio HIIT 20min', category: 'Cardio', exercises: [{ exerciseId: 'ex2', sets: 8, reps: '30s', rest: '30s' }, { exerciseId: 'ex5', sets: 8, reps: '30s', rest: '30s' }], created_at: '2026-06-03T14:00:00Z', updated_at: '2026-06-03T14:00:00Z' }
  ];
  const rIns = db.prepare('INSERT INTO routines (id, name, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
  const reIns = db.prepare('INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  routines.forEach(r => {
    rIns.run([r.id, r.name, r.category, r.created_at, r.updated_at]);
    r.exercises.forEach((ex, i) => reIns.run([r.id, ex.exerciseId, ex.sets, ex.reps, ex.rest, i]));
  });
  rIns.free();
  reIns.free();

  const clients = [
    { id: 'cl1', name: 'María García', email: 'maria@email.com', phone: '+52 555 111 2233', notes: 'Objetivo: pérdida de peso y tonificación.', streak: 12, password: 'maria2026', created_at: '2026-05-20T09:00:00Z', updated_at: '2026-05-20T09:00:00Z' },
    { id: 'cl2', name: 'Carlos López', email: 'carlos@email.com', phone: '+52 555 444 5566', notes: 'Enfocado en rendimiento deportivo.', streak: 5, password: 'carlos01', created_at: '2026-05-25T10:00:00Z', updated_at: '2026-05-25T10:00:00Z' }
  ];
  const cIns = db.prepare('INSERT INTO clients (id, name, email, phone, notes, streak, pago_inicio, pago_fin, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  clients.forEach(c => cIns.run([c.id, c.name, c.email, c.phone, c.notes, c.streak, c.pago_inicio || '', c.pago_fin || '', c.password || '', c.created_at, c.updated_at]));
  cIns.free();

  const crIns = db.prepare('INSERT INTO client_routines (client_id, routine_id, assigned_at) VALUES (?, ?, ?)');
  crIns.run(['cl1', 'rt1', '2026-05-20T09:00:00Z']);
  crIns.run(['cl2', 'rt2', '2026-05-25T10:00:00Z']);
  crIns.free();

  save();
  console.log('Database seeded with sample data.');
}

module.exports = { init, save, exportBuffer, importBuffer, createBackup, listBackups, getDbInfo, getDbPath, getBackupDir, allExercises, getExercise, createExercise, updateExercise, deleteExercise, allRoutines, getRoutine, createRoutine, updateRoutine, deleteRoutine, allClients, getClient, createClient, updateClient, deleteClient, assignRoutine, unassignRoutine, seed, count, startWorkout, completeWorkout, getWorkoutHistory, getActiveWorkout, getClientRoutinesWithDetail, getWeeklyStats, getClientDashboard, getWeeklySchedule, setWeeklyScheduleDay, removeWeeklyScheduleDay, generatePassword, verifyPassword };
