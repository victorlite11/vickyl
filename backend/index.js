
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import * as db from './db.js';

const app = express();

// will initialize DB (sqlite or pg) below
const SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// If a frontend build exists at ../dist, serve it as static files so
// the backend can host both API and frontend for single-service deploys.
const FRONTEND_DIST = path.join(__dirname, '..', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  console.log('Serving frontend from', FRONTEND_DIST);
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// --- ONLINE TEACHERS (simple in-memory for demo) ---
let onlineTeachers = new Set();

// We'll create tables via adapter init

// --- AUTH MIDDLEWARE ---
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);
  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    console.log('JWT verification failed:', err.message);
    res.status(401).json({ error: 'Invalid token', reason: err.message });
  }
}

// --- REGISTER ---
// Signup endpoint for compatibility with frontend
app.post('/api/signup', async (req, res) => {
  // Reuse the register logic
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const userRole = role === 'admin' ? 'admin' : 'teacher';
  const hash = bcrypt.hashSync(password, 10);
  try {
    const r = await db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, userRole]);
    const userId = r.lastID || (r.rows && r.rows[0] && r.rows[0].id) || null;
    const user = { id: userId, name, email, role: userRole };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ success: true, user, token });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Signup failed' });
  }
});
// Register endpoint for teacher or admin
app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const userRole = role === 'admin' ? 'admin' : 'teacher';
  const hash = bcrypt.hashSync(password, 10);
  try {
    const r = await db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, userRole]);
    const userId = r.lastID || (r.rows && r.rows[0] && r.rows[0].id) || null;
    const user = { id: userId, name, email, role: userRole };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// --- LOGIN ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'Invalid credentials' });
    onlineTeachers.add(user.id); // Mark teacher online
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// --- LOGOUT ---
app.post('/api/logout', auth, (req, res) => {
  onlineTeachers.delete(req.user.id);
  res.json({ success: true });
});

// --- STATS ---
app.get('/api/stats', async (req, res) => {
  try {
    const lpRow = await db.get("SELECT COUNT(*) as count FROM submissions WHERE type = 'lesson-plan'");
    const exRow = await db.get("SELECT COUNT(*) as count FROM submissions WHERE type = 'exam'");
    const lessonPlans = lpRow?.count || 0;
    const exams = exRow?.count || 0;
    const downloads = 0; // Placeholder
    const musicSessions = 0; // Placeholder
    res.json({ lessonPlans, exams, downloads, musicSessions });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// --- RECENT ACTIVITY ---
app.get('/api/recent', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM submissions ORDER BY created DESC LIMIT 10');
    res.json(rows || []);
  } catch (e) {
    res.json([]);
  }
});

// --- SUBMISSIONS CRUD ---
app.post('/api/submissions', auth, async (req, res) => {
  const { type, title, content } = req.body;
  if (!type || !title || !content) return res.status(400).json({ error: 'Missing fields' });
  try {
    const info = await db.run('INSERT INTO submissions (userId, type, title, content) VALUES (?, ?, ?, ?)', [req.user.id, type, title, content]);
    const id = info.lastID || (info.rows && info.rows[0] && info.rows[0].id);
    const submission = await db.get('SELECT * FROM submissions WHERE id = ?', [id]);
    res.json({ id, created: submission?.created });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM submissions');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    res.json([]);
  }
});

app.patch('/api/submissions/:id', auth, async (req, res) => {
  const { status } = req.body;
  try {
    await db.run('UPDATE submissions SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// --- MESSAGES ENDPOINTS ---
// Send message (admin or teacher)
app.post('/api/messages', auth, async (req, res) => {
  const { content, recipientId, broadcast } = req.body;
  if (!content) return res.status(400).json({ error: 'Missing content' });
  try {
    if (req.user.role === 'admin') {
      if (!recipientId && !broadcast) return res.status(400).json({ error: 'Missing recipient' });
      if (broadcast) {
        // Send to all teachers
        let teachers = await db.all('SELECT id FROM users WHERE role = $1', ['teacher']);
        if (!Array.isArray(teachers)) teachers = [];
        for (const t of teachers) {
          await db.run('INSERT INTO messages (senderId, recipientId, content) VALUES (?, ?, ?)', [req.user.id, t.id, content]);
        }
        return res.json({ success: true, broadcast: true });
      } else {
        await db.run('INSERT INTO messages (senderId, recipientId, content) VALUES (?, ?, ?)', [req.user.id, recipientId, content]);
        return res.json({ success: true });
      }
    } else if (req.user.role === 'teacher') {
      // Teachers can only send to admin
      const admin = await db.get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
      if (!admin) return res.status(500).json({ error: 'No admin found' });
      await db.run('INSERT INTO messages (senderId, recipientId, content) VALUES (?, ?, ?)', [req.user.id, admin.id, content]);
      return res.json({ success: true });
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});
// --- SCHOOL QUOTA ENDPOINT (stub) ---
app.get('/api/school-quota', auth, (req, res) => {
  // Stub: return dummy quota info
  res.json({ quota: 100, used: 10, active: true });
});

// Get messages between current user and another user (admin/teacher)
app.get('/api/messages', auth, async (req, res) => {
  const withUser = req.query.withUser;
  try {
    let rows;
    if (withUser) {
      // Fetch all messages between current user and withUser
      rows = await db.all(`SELECT * FROM messages WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?) ORDER BY created ASC`, [req.user.id, withUser, withUser, req.user.id]);
    } else {
      // Default: fetch all messages sent to current user
      rows = await db.all('SELECT * FROM messages WHERE recipientId = ? ORDER BY created DESC', [req.user.id]);
    }
    res.json(rows || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// --- ONLINE TEACHERS ENDPOINT ---
// --- ALL TEACHERS ENDPOINT ---
app.get('/api/teachers', async (req, res) => {
  try {
    const rows = await db.all('SELECT id, name, email, role FROM users');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    res.json([]);
  }
});
app.get('/api/online-teachers', auth, async (req, res) => {
  try {
    const ids = Array.from(onlineTeachers);
    const teachers = [];
    for (const id of ids) {
      const t = await db.get('SELECT id, name, email FROM users WHERE id = ?', [id]);
      if (t) teachers.push(t);
    }
    res.json(teachers);
  } catch (e) {
    res.json([]);
  }
});

// --- SUBJECTS ENDPOINTS ---
app.get('/api/subjects', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM subjects ORDER BY name ASC');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) { res.json([]); }
});

app.post('/api/subjects', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const info = await db.run('INSERT INTO subjects (name) VALUES (?)', [name]);
    const id = info.lastID || (info.rows && info.rows[0] && info.rows[0].id);
    const subject = await db.get('SELECT * FROM subjects WHERE id = ?', [id]);
    res.json(subject);
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Subject already exists' });
    console.error('Failed to add subject:', e);
    res.status(500).json({ error: 'Failed to add subject', details: e.message });
  }
});

// Unauthenticated seed endpoint for convenience (populates common subjects)
app.post('/api/subjects/seed', async (req, res) => {
  const defaults = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'History'];
  try {
    for (const name of defaults) {
      try {
        await db.run('INSERT INTO subjects (name) VALUES (?)', [name]);
      } catch (e) {
        // ignore duplicates
      }
    }
    const rows = await db.all('SELECT * FROM subjects ORDER BY name ASC');
    res.json({ seeded: true, subjects: rows });
  } catch (e) {
    console.error('Failed to seed subjects:', e);
    res.status(500).json({ error: 'Failed to seed subjects', details: e.message });
  }
});

// --- EXAM RECORDS ENDPOINTS ---
app.post('/api/exam-records', auth, async (req, res) => {
  const {
    teacherId, studentName, subjectId,
    firstTermScore, firstTermCA, secondTermScore, secondTermCA, thirdTermScore, thirdTermCA
  } = req.body;
  if (!studentName || !subjectId) return res.status(400).json({ error: 'Missing studentName or subjectId' });
  try {
    const info = await db.run(`INSERT INTO exam_records (
      teacherId, studentName, subjectId,
      firstTermScore, firstTermCA, secondTermScore, secondTermCA, thirdTermScore, thirdTermCA
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      teacherId || req.user.id, studentName, subjectId,
      firstTermScore || 0, firstTermCA || 0, secondTermScore || 0, secondTermCA || 0, thirdTermScore || 0, thirdTermCA || 0
    ]);
    const id = info.lastID || (info.rows && info.rows[0] && info.rows[0].id);
    const rec = await db.get('SELECT * FROM exam_records WHERE id = ?', [id]);
    res.json(rec);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save record' });
  }
});

app.get('/api/exam-records', auth, async (req, res) => {
  const { subjectId, teacherId } = req.query;
  try {
    let rows = await db.all('SELECT er.*, s.name as subjectName, u.name as teacherName FROM exam_records er LEFT JOIN subjects s ON er.subjectId = s.id LEFT JOIN users u ON er.teacherId = u.id');
    if (subjectId) rows = rows.filter(r => String(r.subjectId) === String(subjectId));
    if (teacherId) rows = rows.filter(r => String(r.teacherId) === String(teacherId));
    res.json(rows || []);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch records' }); }
});

// Export CSV
app.get('/api/exam-records/export/csv', auth, async (req, res) => {
  try {
    const rows = await db.all('SELECT er.*, s.name as subjectName, u.name as teacherName FROM exam_records er LEFT JOIN subjects s ON er.subjectId = s.id LEFT JOIN users u ON er.teacherId = u.id');
    const header = ['id','teacherName','studentName','subjectName','firstTermScore','firstTermCA','secondTermScore','secondTermCA','thirdTermScore','thirdTermCA','created'];
    const csv = [header.join(',')].concat((rows || []).map(r => [r.id, `"${r.teacherName || ''}"`, `"${r.studentName || ''}"`, `"${r.subjectName || ''}"`, r.firstTermScore, r.firstTermCA, r.secondTermScore, r.secondTermCA, r.thirdTermScore, r.thirdTermCA, `"${r.created}"`].join(','))).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="exam-records.csv"');
    res.send(csv);
  } catch (e) { res.status(500).json({ error: 'Failed to export CSV' }); }
});

// Initialize DB and create tables if needed then start server
async function createTablesIfNeeded() {
  // Create tables using SQL compatible with both sqlite and postgres
  await db.run(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'teacher',
    schoolId INTEGER
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    userId INTEGER,
    type TEXT,
    title TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending',
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    senderId INTEGER,
    recipientId INTEGER,
    content TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS exam_records (
    id SERIAL PRIMARY KEY,
    teacherId INTEGER,
    studentName TEXT,
    subjectId INTEGER,
    firstTermScore REAL,
    firstTermCA REAL,
    secondTermScore REAL,
    secondTermCA REAL,
    thirdTermScore REAL,
    thirdTermCA REAL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}

async function start() {
  try {
    await db.init();
    await createTablesIfNeeded();
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log('Backend running on port', PORT));
  } catch (e) {
    console.error('Failed to start server:', e);
    process.exit(1);
  }
}

start();
