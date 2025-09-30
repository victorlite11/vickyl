import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import fs from 'fs';

const usePg = Boolean(process.env.DATABASE_URL);

function convertPlaceholders(sql) {
  // convert ? placeholders to $1, $2.. for pg
  let i = 0;
  return sql.replace(/\?/g, () => {
    i += 1;
    return `$${i}`;
  });
}

let sqliteDb = null;
let pgPool = null;

export async function init() {
  if (usePg) {
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : false });
    await pgPool.query('SELECT 1');
    return;
  }
  const DB_FILE = process.env.DB_FILE || 'lesson-spark.db';
  // ensure folder exists
  sqliteDb = new sqlite3.Database(DB_FILE);
}

export async function run(sql, params = []) {
  if (usePg) {
    const q = convertPlaceholders(sql);
    const res = await pgPool.query(q, params);
    return res;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export async function get(sql, params = []) {
  if (usePg) {
    const q = convertPlaceholders(sql);
    const res = await pgPool.query(q, params);
    return res.rows[0];
  }
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export async function all(sql, params = []) {
  if (usePg) {
    const q = convertPlaceholders(sql);
    const res = await pgPool.query(q, params);
    return res.rows;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export async function close() {
  if (usePg && pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}

export const isPg = usePg;
