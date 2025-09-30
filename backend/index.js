
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();

// --- DELETE USER ENDPOINT ---
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
const db = new sqlite3.Database('lesson-spark.db');
const SECRET = 'supersecretkey';

app.use(cors());
app.use(express.json());

// --- ONLINE TEACHERS (simple in-memory for demo) ---
let onlineTeachers = new Set();

// --- MESSAGES TABLE ---
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  senderId INTEGER,
  recipientId INTEGER,
  content TEXT,
  created DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// --- DB INIT ---
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'teacher',
  schoolId INTEGER,
  FOREIGN KEY (schoolId) REFERENCES schools(id)
)`);
db.run(`CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  type TEXT,
  title TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending',
  created DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// --- SUBJECTS TABLE ---
db.run(`CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  created DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// --- EXAM RECORDS TABLE ---
db.run(`CREATE TABLE IF NOT EXISTS exam_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacherId INTEGER,
  studentName TEXT,
  subjectId INTEGER,
  firstTermScore REAL,
  firstTermCA REAL,
  secondTermScore REAL,
  secondTermCA REAL,
  thirdTermScore REAL,
  thirdTermCA REAL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(subjectId) REFERENCES subjects(id),
  FOREIGN KEY(teacherId) REFERENCES users(id)
)`);

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
app.post('/api/signup', (req, res) => {
  // Reuse the register logic
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const userRole = role === 'admin' ? 'admin' : 'teacher';
  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, email, hash, userRole);
    const user = { id: info.lastInsertRowid, name, email, role: userRole };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ success: true, user, token });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Signup failed' });
  }
});
// Register endpoint for teacher or admin
app.post('/api/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const userRole = role === 'admin' ? 'admin' : 'teacher';
  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, email, hash, userRole);
    const user = { id: info.lastInsertRowid, name, email, role: userRole };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// --- LOGIN ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'Invalid credentials' });
    onlineTeachers.add(user.id); // Mark teacher online
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  });
});

// --- LOGOUT ---
app.post('/api/logout', auth, (req, res) => {
  onlineTeachers.delete(req.user.id);
  res.json({ success: true });
});

// --- STATS ---
app.get('/api/stats', (req, res) => {
  const lessonPlans = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE type = 'lesson-plan'").get().count;
  const exams = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE type = 'exam'").get().count;
  const downloads = 0; // Placeholder
  const musicSessions = 0; // Placeholder
  res.json({ lessonPlans, exams, downloads, musicSessions });
});

// --- RECENT ACTIVITY ---
app.get('/api/recent', (req, res) => {
  const rows = db.prepare('SELECT * FROM submissions ORDER BY created DESC LIMIT 10').all();
  res.json(rows);
});

// --- SUBMISSIONS CRUD ---
app.post('/api/submissions', auth, (req, res) => {
  const { type, title, content } = req.body;
  if (!type || !title || !content) return res.status(400).json({ error: 'Missing fields' });
  const stmt = db.prepare('INSERT INTO submissions (userId, type, title, content) VALUES (?, ?, ?, ?)');
  const info = stmt.run(req.user.id, type, title, content);
  // Get created timestamp
  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(info.lastInsertRowid);
  res.json({ id: info.lastInsertRowid, created: submission.created });
});

app.get('/api/submissions', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM submissions').all();
    if (Array.isArray(rows)) {
      res.json(rows);
    } else {
      res.json([]);
    }
  } catch (e) {
    res.json([]);
  }
});

app.patch('/api/submissions/:id', auth, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// --- MESSAGES ENDPOINTS ---
// Send message (admin or teacher)
app.post('/api/messages', auth, (req, res) => {
  const { content, recipientId, broadcast } = req.body;
  if (!content) return res.status(400).json({ error: 'Missing content' });
  if (req.user.role === 'admin') {
    if (!recipientId && !broadcast) return res.status(400).json({ error: 'Missing recipient' });
    if (broadcast) {
      // Send to all teachers
      let teachers = db.prepare('SELECT id FROM users WHERE role = "teacher"').all();
      if (!Array.isArray(teachers)) teachers = [];
      teachers.forEach(t => {
        db.prepare('INSERT INTO messages (senderId, recipientId, content) VALUES (?, ?, ?)').run(req.user.id, t.id, content);
      });
      return res.json({ success: true, broadcast: true });
    } else {
      db.prepare('INSERT INTO messages (senderId, recipientId, content) VALUES (?, ?, ?)').run(req.user.id, recipientId, content);
      return res.json({ success: true });
    }
  } else if (req.user.role === 'teacher') {
    // Teachers can only send to admin
    const admin = db.prepare('SELECT id FROM users WHERE role = "admin" LIMIT 1').get();
    if (!admin) return res.status(500).json({ error: 'No admin found' });
    db.prepare('INSERT INTO messages (senderId, recipientId, content) VALUES (?, ?, ?)').run(req.user.id, admin.id, content);
    return res.json({ success: true });
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }
});
// --- SCHOOL QUOTA ENDPOINT (stub) ---
app.get('/api/school-quota', auth, (req, res) => {
  // Stub: return dummy quota info
  res.json({ quota: 100, used: 10, active: true });
});

// Get messages between current user and another user (admin/teacher)
app.get('/api/messages', auth, (req, res) => {
  const withUser = req.query.withUser;
  let rows;
  if (withUser) {
    // Fetch all messages between current user and withUser
    rows = db.prepare(`
      SELECT * FROM messages
      WHERE (senderId = ? AND recipientId = ?)
         OR (senderId = ? AND recipientId = ?)
      ORDER BY created ASC
    `).all(req.user.id, withUser, withUser, req.user.id);
  } else {
    // Default: fetch all messages sent to current user
    rows = db.prepare('SELECT * FROM messages WHERE recipientId = ? ORDER BY created DESC').all(req.user.id);
  }
  res.json(rows);
});

// --- ONLINE TEACHERS ENDPOINT ---
// --- ALL TEACHERS ENDPOINT ---
app.get('/api/teachers', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, email, role FROM users').all();
    if (Array.isArray(rows)) {
      res.json(rows);
    } else {
      res.json([]);
    }
  } catch (e) {
    res.json([]);
  }
});
app.get('/api/online-teachers', auth, (req, res) => {
  const ids = Array.from(onlineTeachers);
  const teachers = ids.map(id => db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id)).filter(Boolean);
  res.json(teachers);
});

// --- SUBJECTS ENDPOINTS ---
app.get('/api/subjects', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM subjects ORDER BY name ASC').all();
    res.json(rows);
  } catch (e) { res.json([]); }
});

app.post('/api/subjects', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const stmt = db.prepare('INSERT INTO subjects (name) VALUES (?)');
    const info = stmt.run(name);
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(info.lastInsertRowid);
    res.json(subject);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Subject already exists' });
    console.error('Failed to add subject:', e);
    res.status(500).json({ error: 'Failed to add subject', details: e.message });
  }
});

// Unauthenticated seed endpoint for convenience (populates common subjects)
app.post('/api/subjects/seed', (req, res) => {
  const defaults = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'History'];
  try {
    const insert = db.prepare('INSERT OR IGNORE INTO subjects (name) VALUES (?)');
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      for (const name of defaults) insert.run(name);
      db.run('COMMIT');
    });
    const rows = db.prepare('SELECT * FROM subjects ORDER BY name ASC').all();
    res.json({ seeded: true, subjects: rows });
  } catch (e) {
    console.error('Failed to seed subjects:', e);
    res.status(500).json({ error: 'Failed to seed subjects', details: e.message });
  }
});

// --- EXAM RECORDS ENDPOINTS ---
app.post('/api/exam-records', auth, (req, res) => {
  const {
    teacherId, studentName, subjectId,
    firstTermScore, firstTermCA, secondTermScore, secondTermCA, thirdTermScore, thirdTermCA
  } = req.body;
  if (!studentName || !subjectId) return res.status(400).json({ error: 'Missing studentName or subjectId' });
  try {
    const stmt = db.prepare(`INSERT INTO exam_records (
      teacherId, studentName, subjectId,
      firstTermScore, firstTermCA, secondTermScore, secondTermCA, thirdTermScore, thirdTermCA
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const info = stmt.run(
      teacherId || req.user.id, studentName, subjectId,
      firstTermScore || 0, firstTermCA || 0, secondTermScore || 0, secondTermCA || 0, thirdTermScore || 0, thirdTermCA || 0
    );
    const rec = db.prepare('SELECT * FROM exam_records WHERE id = ?').get(info.lastInsertRowid);
    res.json(rec);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save record' });
  }
});

app.get('/api/exam-records', auth, (req, res) => {
  const { subjectId, teacherId } = req.query;
  try {
    let rows = db.prepare('SELECT er.*, s.name as subjectName, u.name as teacherName FROM exam_records er LEFT JOIN subjects s ON er.subjectId = s.id LEFT JOIN users u ON er.teacherId = u.id').all();
    if (subjectId) rows = rows.filter(r => String(r.subjectId) === String(subjectId));
    if (teacherId) rows = rows.filter(r => String(r.teacherId) === String(teacherId));
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch records' }); }
});

// Export CSV
app.get('/api/exam-records/export/csv', auth, (req, res) => {
  try {
    const rows = db.prepare('SELECT er.*, s.name as subjectName, u.name as teacherName FROM exam_records er LEFT JOIN subjects s ON er.subjectId = s.id LEFT JOIN users u ON er.teacherId = u.id').all();
    const header = ['id','teacherName','studentName','subjectName','firstTermScore','firstTermCA','secondTermScore','secondTermCA','thirdTermScore','thirdTermCA','created'];
    const csv = [header.join(',')].concat(rows.map(r => [r.id, `"${r.teacherName || ''}"`, `"${r.studentName || ''}"`, `"${r.subjectName || ''}"`, r.firstTermScore, r.firstTermCA, r.secondTermScore, r.secondTermCA, r.thirdTermScore, r.thirdTermCA, `"${r.created}"`].join(','))).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="exam-records.csv"');
    res.send(csv);
  } catch (e) { res.status(500).json({ error: 'Failed to export CSV' }); }
});

// --- SERVER ---
const PORT = 4000;
app.listen(PORT, () => console.log('Backend running on port', PORT));
