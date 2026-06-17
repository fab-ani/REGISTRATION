import pg from 'pg';

const { Pool } = pg;

export const CR_REG_NUMBER = '23062313016';

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

async function ensureTables() {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS students (
      reg_number    TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      course        TEXT NOT NULL,
      year_of_study INTEGER NOT NULL CHECK (year_of_study BETWEEN 1 AND 6),
      role          TEXT NOT NULL CHECK (role IN ('student', 'cr')),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id            TEXT PRIMARY KEY,
      subject       TEXT NOT NULL,
      teacher       TEXT NOT NULL,
      period_time   TEXT NOT NULL,
      created_by    TEXT NOT NULL REFERENCES students(reg_number),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at    TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      session_id    TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      student_reg   TEXT NOT NULL REFERENCES students(reg_number),
      scanned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (session_id, student_reg)
    );

    CREATE INDEX IF NOT EXISTS idx_records_student
      ON attendance_records(student_reg);
  `);
}

const g = globalThis;
let initPromise = g.__campusid_pg_init;

async function ready() {
  if (!initPromise) {
    initPromise = ensureTables();
    g.__campusid_pg_init = initPromise;
  }
  await initPromise;
}

// ---- Queries ----------------------------------------------------------------

export async function createStudent({ name, regNumber, course, yearOfStudy }) {
  await ready();
  const role = regNumber === CR_REG_NUMBER ? 'cr' : 'student';
  await getPool().query(
    `INSERT INTO students (reg_number, name, course, year_of_study, role)
     VALUES ($1, $2, $3, $4, $5)`,
    [regNumber, name, course, Number(yearOfStudy), role]
  );
  return getStudent(regNumber);
}

export async function getStudent(regNumber) {
  await ready();
  const { rows } = await getPool().query(
    `SELECT reg_number    AS "regNumber",
            name,
            course,
            year_of_study AS "yearOfStudy",
            role,
            created_at    AS "createdAt"
     FROM students
     WHERE reg_number = $1`,
    [regNumber]
  );
  return rows[0] || null;
}

export async function getAllStudents() {
  await ready();
  const { rows } = await getPool().query(
    `SELECT reg_number    AS "regNumber",
            name,
            course,
            year_of_study AS "yearOfStudy",
            role,
            created_at    AS "createdAt"
     FROM students
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function getCRForCourse(course) {
  await ready();
  const { rows } = await getPool().query(
    `SELECT reg_number    AS "regNumber",
            name,
            course,
            year_of_study AS "yearOfStudy",
            role,
            created_at    AS "createdAt"
     FROM students
     WHERE role = 'cr' AND LOWER(course) = LOWER($1)
     LIMIT 1`,
    [course]
  );
  return rows[0] || null;
}

// ---- Attendance sessions ----------------------------------------------------

const DEFAULT_SESSION_MINUTES = 30;

export async function createSession({ subject, teacher, periodTime, createdBy, durationMinutes }) {
  await ready();
  const id = cryptoRandomId();
  const minutes = Number.isFinite(Number(durationMinutes)) && Number(durationMinutes) > 0
    ? Math.floor(Number(durationMinutes))
    : DEFAULT_SESSION_MINUTES;

  await getPool().query(
    `INSERT INTO attendance_sessions (id, subject, teacher, period_time, created_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, NOW() + make_interval(mins => $6))`,
    [id, subject, teacher, periodTime, createdBy, minutes]
  );
  return getSession(id);
}

export async function getSession(id) {
  await ready();
  const { rows } = await getPool().query(
    `SELECT id,
            subject,
            teacher,
            period_time AS "periodTime",
            created_by  AS "createdBy",
            created_at  AS "createdAt",
            expires_at  AS "expiresAt"
     FROM attendance_sessions
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getSessionsByCreator(reg) {
  await ready();
  const { rows } = await getPool().query(
    `SELECT id,
            subject,
            teacher,
            period_time AS "periodTime",
            created_by  AS "createdBy",
            created_at  AS "createdAt",
            expires_at  AS "expiresAt"
     FROM attendance_sessions
     WHERE created_by = $1
     ORDER BY created_at DESC`,
    [reg]
  );
  return rows;
}

// ---- Attendance records -----------------------------------------------------

export async function recordAttendance({ sessionId, studentReg }) {
  await ready();
  const result = await getPool().query(
    `INSERT INTO attendance_records (session_id, student_reg)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [sessionId, studentReg]
  );
  return result.rowCount > 0;
}

export async function getAttendees(sessionId) {
  await ready();
  const { rows } = await getPool().query(
    `SELECT a.student_reg AS "regNumber",
            s.name,
            s.course,
            a.scanned_at  AS "scannedAt"
     FROM attendance_records a
     JOIN students s ON s.reg_number = a.student_reg
     WHERE a.session_id = $1
     ORDER BY a.scanned_at ASC`,
    [sessionId]
  );
  return rows;
}

export async function getStudentAttendance(reg) {
  await ready();
  const { rows } = await getPool().query(
    `SELECT s.id          AS "sessionId",
            s.subject,
            s.teacher,
            s.period_time AS "periodTime",
            a.scanned_at  AS "scannedAt"
     FROM attendance_records a
     JOIN attendance_sessions s ON s.id = a.session_id
     WHERE a.student_reg = $1
     ORDER BY a.scanned_at DESC`,
    [reg]
  );
  return rows;
}

export async function isSessionExpired(session) {
  if (!session) return true;
  const { rows } = await getPool().query(`SELECT NOW() AS t`);
  return new Date(session.expiresAt) <= new Date(rows[0].t);
}

// ---- Helpers ----------------------------------------------------------------

function cryptoRandomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}
