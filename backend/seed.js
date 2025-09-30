import * as db from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

export async function seed() {
  await db.init();
  console.log('Seeding DB...');

  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const teacherPass = process.env.TEACHER_PASSWORD || 'teacher123';

  const adminHash = bcrypt.hashSync(adminPass, 10);
  const teacherHash = bcrypt.hashSync(teacherPass, 10);

  // create admin
  try {
    const r1 = await db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Admin User', 'admin@example.com', adminHash, 'admin']);
    const adminId = r1.lastID || (r1.rows && r1.rows[0] && r1.rows[0].id);
    console.log('Created admin id', adminId);
    const adminToken = jwt.sign({ id: adminId, name: 'Admin User', email: 'admin@example.com', role: 'admin' }, SECRET, { expiresIn: '365d' });
    console.log('Admin token (store safely):', adminToken);
  } catch (e) {
    console.log('Admin user may already exist, skipping');
  }

  // create example teacher
  try {
    const r2 = await db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Example Teacher', 'teacher@example.com', teacherHash, 'teacher']);
    const teacherId = r2.lastID || (r2.rows && r2.rows[0] && r2.rows[0].id);
    console.log('Created teacher id', teacherId);
    const teacherToken = jwt.sign({ id: teacherId, name: 'Example Teacher', email: 'teacher@example.com', role: 'teacher' }, SECRET, { expiresIn: '365d' });
    console.log('Teacher token (store safely):', teacherToken);
  } catch (e) {
    console.log('Teacher user may already exist, skipping');
  }

  // seed subjects
  const defaults = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'History'];
  for (const name of defaults) {
    try { await db.run('INSERT INTO subjects (name) VALUES (?)', [name]); } catch (e) {}
  }

  console.log('Seeding complete');
}

// Run as script when invoked directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}
