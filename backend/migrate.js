import * as db from './db.js';

async function migrate() {
  try {
    await db.init();
    console.log('Connected to DB. Creating tables...');

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
      resourceUrl TEXT,
      resourceName TEXT,
      created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // For existing databases, attempt to add the new columns if they don't exist.
    try {
      await db.run("ALTER TABLE messages ADD COLUMN IF NOT EXISTS resourceUrl TEXT");
      await db.run("ALTER TABLE messages ADD COLUMN IF NOT EXISTS resourceName TEXT");
    } catch (e) {
      // Some adapters (older sqlite) don't support IF NOT EXISTS in ALTER; try generic ALTER and ignore errors
      try { await db.run('ALTER TABLE messages ADD COLUMN resourceUrl TEXT'); } catch (err) {}
      try { await db.run('ALTER TABLE messages ADD COLUMN resourceName TEXT'); } catch (err) {}
    }

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

    console.log('Migration complete');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed', e);
    process.exit(1);
  }
}

migrate();
